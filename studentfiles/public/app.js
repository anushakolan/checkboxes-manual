const checkboxState = Array.from({length: 1000}, (_, index) => ({
    id: index,
    isChecked: false,
    eTag: null
}));

const syncQueue = [];
let isOnline = navigator.onLine;

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('checkbox-grid');
    const srAnnouncer = document.getElementById('sr-announcer');
    const statusIndicator = document.getElementById('connection-status');
    
    // Performance: use a DocumentFragment for efficient bulk insertion
    // Target constraint: Init render < 100ms, DOM nodes ≤ 3,000 nodes (1000 wrappers + 1000 inputs = 2000 nodes added)
    const fragment = document.createDocumentFragment();
    
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
        
        // Add pending class
        checkboxElement.classList.add('pending');
        
        // Announce change
        announce(`Checkbox ${index} ${newChecked ? 'checked' : 'unchecked'}`);
        
        // Queue the request
        const request = {
            id: index,
            isChecked: newChecked,
            eTag: currentState.eTag
        };
        
        syncQueue.push(request);
        processQueue();
    }

    async function processQueue() {
        if (!isOnline || syncQueue.length === 0) return;
        
        // We'd loop to process the queue, simulating a sync here
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
                body: JSON.stringify({ isChecked: request.isChecked })
            });

            if (response.ok) {
                const data = await response.json();
                checkboxState[request.id].eTag = data.eTag || Date.now().toString();
                syncQueue.shift(); // Remove successfully processed item
                
                if (checkboxElement) {
                    checkboxElement.classList.remove('pending');
                }
            } else if (response.status === 412) { // Precondition Failed (Conflict)
                // Revert on conflict
                const serverData = await response.json();
                checkboxState[request.id].isChecked = serverData.isChecked;
                checkboxState[request.id].eTag = serverData.eTag;
                
                if (checkboxElement) {
                    checkboxElement.checked = serverData.isChecked;
                    checkboxElement.classList.remove('pending');
                }
                syncQueue.shift();
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Sync failed, queuing for later', error);
            // In a real app, you might use exponential backoff here
            setConnectionStatus('reconnecting');
            // Mock offline queue logic
            setTimeout(() => {
                if(isOnline) setConnectionStatus('connected');
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
