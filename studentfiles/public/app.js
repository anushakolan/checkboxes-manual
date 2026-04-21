document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('checkbox-grid');
    
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
    
    // Add arrow key navigation
    grid.addEventListener('keydown', (e) => {
        const current = e.target;
        if (!current.classList.contains('custom-checkbox')) return;
        
        const index = parseInt(current.dataset.index, 10);
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
