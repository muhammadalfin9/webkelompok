// Utility functions
function seededRandom(seed) {
    let state = seed;
    return function () {
        state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
        return state / Math.pow(2, 32);
    };
}

function fisherYates(array, rng) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function parseNames(text, removeDuplicates = false, trimEmpty = false) {
    let names = text.split('\n');
    
    if (trimEmpty) {
        names = names.map(name => name.trim()).filter(name => name !== '');
    }
    
    if (removeDuplicates) {
        names = [...new Set(names)];
    }
    
    return names;
}

function distribute(names, options) {
    const { mode, groupCount, groupSize } = options;
    let groups = [];
    
    if (mode === 'jumlah') {
        // Distribute based on number of groups
        groups = Array.from({ length: groupCount }, () => []);
        names.forEach((name, index) => {
            groups[index % groupCount].push(name);
        });
    } else {
        // Distribute based on group size
        const numGroups = Math.ceil(names.length / groupSize);
        groups = Array.from({ length: numGroups }, () => []);
        names.forEach((name, index) => {
            groups[Math.floor(index / groupSize)].push(name);
        });
    }
    
    return groups;
}

function distributeBalanced(names, options) {
    const { mode, groupCount, groupSize } = options;
    let numGroups;
    
    if (mode === 'jumlah') {
        numGroups = groupCount;
    } else {
        numGroups = Math.ceil(names.length / groupSize);
    }
    
    const groups = Array.from({ length: numGroups }, () => []);
    
    // Round-robin distribution for balanced groups
    names.forEach((name, index) => {
        groups[index % numGroups].push(name);
    });
    
    return groups;
}

// Main application
class GroupMaker {
    constructor() {
        this.state = {
            history: [],
            currentIndex: -1,
            groups: []
        };
        
        this.initElements();
        this.initEventListeners();
        this.loadFromURL();
    }
    
    initElements() {
        // Form elements
        this.namesTextarea = document.getElementById('names');
        this.modeRadios = document.querySelectorAll('input[name="mode"]');
        this.groupCountInput = document.getElementById('group-count');
        this.groupSizeInput = document.getElementById('group-size');
        this.removeDuplicatesCheckbox = document.getElementById('remove-duplicates');
        this.trimEmptyCheckbox = document.getElementById('trim-empty');
        this.seedInput = document.getElementById('seed');
        
        // Buttons
        this.generateBtn = document.getElementById('generate');
        this.copyBtn = document.getElementById('copy');
        this.downloadCsvBtn = document.getElementById('download-csv');
        this.downloadJsonBtn = document.getElementById('download-json');
        this.printBtn = document.getElementById('print');
        this.reshuffleBtn = document.getElementById('reshuffle');
        this.undoBtn = document.getElementById('undo');
        this.redoBtn = document.getElementById('redo');
        this.shareBtn = document.getElementById('share');
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Elements
        this.resultSection = document.getElementById('result-section');
        this.groupsContainer = document.getElementById('groups-container');
        this.errorMessage = document.getElementById('error-message');
        
        // Initialize form state
        this.updateMode();
    }
    
    initEventListeners() {
        // Mode switching
        this.modeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateMode());
        });
        
        // Generate
        this.generateBtn.addEventListener('click', () => this.generateGroups());
        
        // Actions
        this.copyBtn.addEventListener('click', () => this.copyResults());
        this.downloadCsvBtn.addEventListener('click', () => this.downloadCSV());
        this.downloadJsonBtn.addEventListener('click', () => this.downloadJSON());
        this.printBtn.addEventListener('click', () => this.printResults());
        this.reshuffleBtn.addEventListener('click', () => this.generateGroups());
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());
        this.shareBtn.addEventListener('click', () => this.share());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Real-time validation
        this.namesTextarea.addEventListener('input', () => this.validateForm());
        this.groupCountInput.addEventListener('input', () => this.validateForm());
        this.groupSizeInput.addEventListener('input', () => this.validateForm());
    }
    
    updateMode() {
        const isGroupCount = document.querySelector('input[name="mode"]:checked').value === 'jumlah';
        
        this.groupCountInput.disabled = !isGroupCount;
        this.groupSizeInput.disabled = isGroupCount;
        
        if (isGroupCount) {
            this.groupSizeInput.value = '';
        } else {
            this.groupCountInput.value = '';
        }
    }
    
    validateForm() {
        const names = this.namesTextarea.value.trim();
        const mode = document.querySelector('input[name="mode"]:checked').value;
        
        let isValid = true;
        let errorMsg = '';
        
        if (!names) {
            isValid = false;
            errorMsg = 'Masukkan minimal satu nama.';
        } else {
            const parsedNames = parseNames(
                names, 
                this.removeDuplicatesCheckbox.checked, 
                this.trimEmptyCheckbox.checked
            );
            
            if (parsedNames.length === 0) {
                isValid = false;
                errorMsg = 'Tidak ada nama yang valid setelah pemrosesan.';
            } else if (mode === 'jumlah') {
                const groupCount = parseInt(this.groupCountInput.value);
                if (isNaN(groupCount) || groupCount < 1) {
                    isValid = false;
                    errorMsg = 'Jumlah kelompok harus minimal 1.';
                } else if (groupCount > parsedNames.length) {
                    isValid = false;
                    errorMsg = 'Jumlah kelompok tidak boleh lebih dari jumlah nama.';
                }
            } else {
                const groupSize = parseInt(this.groupSizeInput.value);
                if (isNaN(groupSize) || groupSize < 1) {
                    isValid = false;
                    errorMsg = 'Ukuran kelompok harus minimal 1.';
                }
            }
        }
        
        this.generateBtn.disabled = !isValid;
        this.errorMessage.textContent = errorMsg;
        this.errorMessage.style.display = errorMsg ? 'block' : 'none';
        
        return isValid;
    }
    
    getOptions() {
        return {
            mode: document.querySelector('input[name="mode"]:checked').value,
            groupCount: parseInt(this.groupCountInput.value) || 0,
            groupSize: parseInt(this.groupSizeInput.value) || 0,
            removeDuplicates: this.removeDuplicatesCheckbox.checked,
            trimEmpty: this.trimEmptyCheckbox.checked,
            seed: this.seedInput.value || null
        };
    }
    
    generateGroups() {
        if (!this.validateForm()) return;
        
        const names = this.namesTextarea.value;
        const options = this.getOptions();
        
        let parsedNames = parseNames(names, options.removeDuplicates, options.trimEmpty);
        
        if (parsedNames.length === 0) {
            this.errorMessage.textContent = 'Tidak ada nama yang valid.';
            return;
        }
        
        // Use seeded random if seed provided
        const rng = options.seed ? seededRandom(this.hashSeed(options.seed)) : Math.random;
        const shuffledNames = fisherYates(parsedNames, rng);
        
        // Distribute names into balanced groups
        const groups = distributeBalanced(shuffledNames, options);
        
        // Update state
        this.state.groups = groups;
        
        // Save state
        this.saveState();
        
        // Render results
        this.renderGroups(groups);
        this.resultSection.style.display = 'block';
    }
    
    renderGroups(groups) {
        this.groupsContainer.innerHTML = '';
        
        groups.forEach((group, index) => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            
            const groupTitle = document.createElement('h3');
            groupTitle.textContent = `Kelompok ${index + 1}`;
            
            const memberList = document.createElement('ul');
            memberList.className = 'group-members';
            
            group.forEach(member => {
                const memberItem = document.createElement('li');
                memberItem.textContent = member;
                memberList.appendChild(memberItem);
            });
            
            groupCard.appendChild(groupTitle);
            groupCard.appendChild(memberList);
            this.groupsContainer.appendChild(groupCard);
        });
    }
    
    copyResults() {
        const text = this.formatResults();
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = this.copyBtn.textContent;
                this.copyBtn.textContent = 'Tersalin!';
                setTimeout(() => {
                    this.copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
    
    downloadCSV() {
        const csv = this.formatResultsCSV();
        this.downloadFile(csv, 'kelompok.csv', 'text/csv');
    }
    
    downloadJSON() {
        const json = JSON.stringify(this.state.groups, null, 2);
        this.downloadFile(json, 'kelompok.json', 'application/json');
    }
    
    printResults() {
        window.print();
    }
    
    formatResults() {
        let text = '';
        this.state.groups.forEach((group, index) => {
            text += `Kelompok ${index + 1}:\n`;
            group.forEach(member => {
                text += `- ${member}\n`;
            });
            text += '\n';
        });
        return text;
    }
    
    formatResultsCSV() {
        let csv = 'Kelompok,Anggota\n';
        this.state.groups.forEach((group, index) => {
            group.forEach(member => {
                csv += `"Kelompok ${index + 1}","${member}"\n`;
            });
        });
        return csv;
    }
    
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
    
    saveState() {
        // Add current state to history
        this.state.history = this.state.history.slice(0, this.state.currentIndex + 1);
        this.state.history.push({
            groups: [...this.state.groups]
        });
        this.state.currentIndex++;
        
        // Update undo/redo buttons
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            const prevState = this.state.history[this.state.currentIndex];
            this.state.groups = [...prevState.groups];
            this.renderGroups(this.state.groups);
            this.updateUndoRedoButtons();
        }
    }
    
    redo() {
        if (this.state.currentIndex < this.state.history.length - 1) {
            this.state.currentIndex++;
            const nextState = this.state.history[this.state.currentIndex];
            this.state.groups = [...nextState.groups];
            this.renderGroups(this.state.groups);
            this.updateUndoRedoButtons();
        }
    }
    
    updateUndoRedoButtons() {
        this.undoBtn.disabled = this.state.currentIndex <= 0;
        this.redoBtn.disabled = this.state.currentIndex >= this.state.history.length - 1;
    }
    
    share() {
        const params = new URLSearchParams();
        params.set('names', this.namesTextarea.value);
        params.set('mode', document.querySelector('input[name="mode"]:checked').value);
        params.set('groupCount', this.groupCountInput.value);
        params.set('groupSize', this.groupSizeInput.value);
        params.set('removeDuplicates', this.removeDuplicatesCheckbox.checked);
        params.set('trimEmpty', this.trimEmptyCheckbox.checked);
        params.set('seed', this.seedInput.value);
        
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        
        navigator.clipboard.writeText(url)
            .then(() => {
                const originalText = this.shareBtn.textContent;
                this.shareBtn.textContent = 'URL Disalin!';
                setTimeout(() => {
                    this.shareBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback: show in alert
                alert(`Copy this URL: ${url}`);
            });
    }
    
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('names')) {
            this.namesTextarea.value = params.get('names');
        }
        
        if (params.has('mode')) {
            document.querySelectorAll('input[name="mode"]').forEach(radio => {
                radio.checked = radio.value === params.get('mode');
            });
            this.updateMode();
        }
        
        if (params.has('groupCount')) {
            this.groupCountInput.value = params.get('groupCount');
        }
        
        if (params.has('groupSize')) {
            this.groupSizeInput.value = params.get('groupSize');
        }
        
        if (params.has('removeDuplicates')) {
            this.removeDuplicatesCheckbox.checked = params.get('removeDuplicates') === 'true';
        }
        
        if (params.has('trimEmpty')) {
            this.trimEmptyCheckbox.checked = params.get('trimEmpty') === 'true';
        }
        
        if (params.has('seed')) {
            this.seedInput.value = params.get('seed');
        }
        
        // Validate form after loading
        this.validateForm();
    }
    
    hashSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        this.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Save preference to localStorage
        localStorage.setItem('theme', newTheme);
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new GroupMaker();
    app.initTheme();
});