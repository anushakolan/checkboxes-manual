const checkboxState = Array.from({length: 1000}, (_, index) => ({
    id: index,
    isChecked: false,
    eTag: null,
    pending: false
}));

const syncQueue = [];
let isOnline = navigator.onLine;
let signalRConnection = null;

// Create Toast container
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
toastContainer.style.position = 'fixed';
toastContainer.style.bottom = '20px';
toastContainer.style.right = '20px';
toastContainer.style.zIndex = '9999';
document.head.insertAdjacentHTML('beforeend', `
<style>
.toast { background: #333; color: white; padding: 12px 20px; border-radius: 4px; margin-top: 10px; opacity: 1; transition: opacity 0.3s; }
.bounce { animation: bounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes bounce { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
`);

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(toastContainer);
    const grid = document.getElementById('checkbox-grid');
    const srAnnouncer = document.getElementById('sr-announcer');
    const statusIndicator = document.getElementById('connection-status');

    
    // Performance: use a DocumentFragment for efficient bulk insertion
    // Target constraint: Init render < 100ms, DOM nodes ≤ 3,000 nodes (1000 wrappers + 1000 inputs = 2000 nodes added)
    const fragment = document.createDocumentFragment();
    
    // Clear any existing children to prevent duplicates during re-initialization (e.g., in tests)
    grid.innerHTML = '';
    
    for (let i = 0; i < 1000; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'custom-checkbox';
        checkbox.id = `checkbox-${i}`;
        checkbox.dataset.index = i;
        checkbox.setAttribute('aria-label', `Checkbox ${i}`);
        
        wrapper.appendChild(checkbox);
        fragment.appendChild(wrapper);
    }
    
    grid.appendChild(fragment);
    
    // Announce to screen reader
    function announce(message) {
        srAnnouncer.textContent = message;
    }

    // Update connection status
    function setConnectionStatus(status) {
        statusIndicator.className = 'status-indicator';
        if (status === 'connected') {
            statusIndicator.classList.add('status-connected');
            statusIndicator.textContent = 'Connected';
        } else if (status === 'reconnecting') {
            statusIndicator.classList.add('status-reconnecting');
            statusIndicator.textContent = 'Reconnecting...';
        } else {
            statusIndicator.classList.add('status-disconnected');
            statusIndicator.textContent = 'Disconnected';
        }
        announce(`Connection status: ${statusIndicator.textContent}`);
    }

    // Establish SignalR connection
    if (typeof signalR !== 'undefined') {
        signalRConnection = new signalR.HubConnectionBuilder()
            .withUrl("/hubs/checkboxes")
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    const count = retryContext.previousRetryCount;
                    const delay = Math.pow(2, count) * 1000;
                    return Math.min(delay, 30000);
                }
            })
            .build();

        signalRConnection.on("CheckboxUpdated", data => {
            if (!data || data.id === undefined || data.isChecked === undefined || !data.etag) return;
            const index = data.id;
            const state = checkboxState[index];
            
            // Ignore SignalR updates for checkboxes with active pending intent
            if (state.pending) return;

            state.isChecked = data.isChecked;
            state.eTag = data.etag;
            
            const checkboxElement = document.getElementById(`checkbox-${index}`);
            if (checkboxElement && checkboxElement.checked !== data.isChecked) {
                checkboxElement.checked = data.isChecked;
                announce(`Checkbox ${index} updated by another user`);
            }
        });

        signalRConnection.onclose(() => setConnectionStatus('disconnected'));
        signalRConnection.onreconnecting(() => setConnectionStatus('reconnecting'));
        signalRConnection.onreconnected(() => {
            setConnectionStatus('connected');
            // Assuming we'd want to resync the whole state here to ensure correctness
            fetchInitialState(); 
        });

        signalRConnection.start()
            .then(() => setConnectionStatus('connected'))
            .catch(err => console.error("SignalR Connection Error: ", err));
    }

    async function fetchInitialState() {
        try {
            const response = await fetch('/api/checkboxes');
            if (response.ok) {
                const data = await response.json();
                data.checkboxes.forEach(cb => {
                    checkboxState[cb.id].isChecked = cb.isChecked;
                    checkboxState[cb.id].eTag = cb.etag;
                    const el = document.getElementById(`checkbox-${cb.id}`);
                    if (el) el.checked = cb.isChecked;
                });
            }
        } catch (e) {
            console.error("Failed to fetch initial state", e);
        }
    }
    fetchInitialState();

    window.addEventListener('online', () => {
        isOnline = true;
        setConnectionStatus('connected');
        processQueue();
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        setConnectionStatus('disconnected');
    });

    // Handle toggle
    async function toggleCheckbox(index, checkboxElement) {
        const currentState = checkboxState[index];
        const newChecked = checkboxElement.checked;
        
        // Update in-memory state optimistically
        currentState.isChecked = newChecked;
        currentState.pending = true;
        
        // Add pending class
        checkboxElement.classList.add('pending');
        
        // Announce change
        announce(`Checkbox ${index} ${newChecked ? 'checked' : 'unchecked'}`);
        
        // Queue the request
        const request = {
            id: index,
            isChecked: newChecked,
            eTag: currentState.eTag || '',
            retries: 0
        };
        
        syncQueue.push(request);
        processQueue();
    }

    let isProcessing = false;
    async function processQueue() {
        if (!isOnline || syncQueue.length === 0 || isProcessing) return;
        isProcessing = true;
        
        while (syncQueue.length > 0) {
            const request = syncQueue[0];
            const checkboxElement = document.getElementById(`checkbox-${request.id}`);
            
            try {
                // Simulate network request
                const response = await fetch('/api/checkboxes/' + request.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'If-Match': request.eTag || '*'
                    },
                    body: JSON.stringify({ isChecked: request.isChecked, etag: request.eTag || '' })
                });

                if (response.ok) {
                    const data = await response.json();
                    checkboxState[request.id].eTag = data.etag;
                    checkboxState[request.id].pending = false;
                    syncQueue.shift(); // Remove successfully processed item
                    
                    if (checkboxElement) {
                        checkboxElement.classList.remove('pending');
                    }
                } else if (response.status === 412) { // Precondition Failed (Conflict)
                    // Re-fetch entity
                    const serverDataList = await (await fetch('/api/checkboxes')).json();
                    const serverData = serverDataList.checkboxes.find(cb => cb.id === request.id);
                    
                    if (request.retries === undefined) request.retries = 0;
                    if (request.retries < 3) {
                        request.retries++;
                        request.eTag = serverData.etag;
                        
                        // User intended it to be request.isChecked, but we need to re-apply their intent.
                        // Since their intent is absolute boolean, we just keep request.isChecked exactly what it is.
                        continue; // loop again with new etag
                    } else {
                        showToast("Another user changed this checkbox. Please try again.");
                        checkboxState[request.id].isChecked = serverData.isChecked;
                        checkboxState[request.id].eTag = serverData.etag;
                        checkboxState[request.id].pending = false;
                        
                        if (checkboxElement) {
                            checkboxElement.checked = serverData.isChecked;
                            checkboxElement.classList.remove('pending');
                            checkboxElement.parentElement.classList.add('bounce');
                            setTimeout(() => checkboxElement.parentElement.classList.remove('bounce'), 300);
                        }
                        syncQueue.shift();
                    }
                } else {
                    const txt = await response.text();
                    console.error("API error", response.status, txt);
                    throw new Error('Server error');
                }
            } catch (error) {
                console.warn('Sync failed, queuing for later', error);
                setConnectionStatus('reconnecting');
                break; // Break the while loop
            }
        }
        isProcessing = false;
        
        // Re-check after break if still failed
        if (syncQueue.length > 0) {
            setTimeout(() => {
                if (navigator.onLine) processQueue();
            }, 3000);
        }
    }
    
    // Add arrow key and toggle navigation
    grid.addEventListener('keydown', (e) => {
        const current = e.target;
        if (!current.classList.contains('custom-checkbox')) return;
        
        const index = parseInt(current.dataset.index, 10);
        
        // Handle Enter key for toggling
        if (e.key === 'Enter') {
            e.preventDefault();
            current.checked = !current.checked;
            toggleCheckbox(index, current);
            return;
        }

        let cols = 40;
        
        const width = window.innerWidth;
        if (width < 768) {
            cols = 20;
        } else if (width < 1024) {
            cols = 32;
        }
        
        let newIndex = null;
        
        switch (e.key) {
            case 'ArrowRight':
                newIndex = index + 1;
                break;
            case 'ArrowLeft':
                newIndex = index - 1;
                break;
            case 'ArrowDown':
                newIndex = index + cols;
                break;
            case 'ArrowUp':
                newIndex = index - cols;
                break;
        }
        
        if (newIndex !== null && newIndex >= 0 && newIndex < 1000) {
            e.preventDefault();
            const nextCheckbox = document.getElementById(`checkbox-${newIndex}`);
            if (nextCheckbox) nextCheckbox.focus();
        }
    });

    // Handle change event for mouse clicks and spacebar
    grid.addEventListener('change', (e) => {
        const current = e.target;
        if (!current.classList.contains('custom-checkbox')) return;
        
        const index = parseInt(current.dataset.index, 10);
        toggleCheckbox(index, current);
    });

    // Load initial state
    fetchInitialState();
});

async function fetchInitialState() {
    try {
        const response = await fetch('/api/checkboxes');
        if (response.ok) {
            const data = await response.json();
            if (data.checkboxes && Array.isArray(data.checkboxes)) {
                data.checkboxes.forEach(cb => {
                    const el = document.getElementById(`checkbox-${cb.id}`);
                    if (el) {
                        el.checked = cb.isChecked;
                        checkboxState[cb.id].isChecked = cb.isChecked;
                        checkboxState[cb.id].eTag = cb.eTag || null;
                    }
                });
            }
        } else {
            console.log('API returned an error, using default unchecked state for static UI.');
        }
    } catch (err) {
        console.log('Storage API not yet available, falling back to default false state. (Section 1 static testing)');
    }
}
