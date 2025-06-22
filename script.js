class ImageEditor {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.currentImageData = null;
        this.originalImageData = null;
        this.cropMode = false;
        this.cropStart = null;
        this.cropEnd = null;
        this.isDragging = false;
        this.aspectRatio = 1;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // File input
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Tool buttons
        document.getElementById('cropBtn').addEventListener('click', () => this.toggleCropMode());
        document.getElementById('applyCropBtn').addEventListener('click', () => this.applyCrop());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetImage());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        
        // Tab switching
        document.getElementById('filtersTab').addEventListener('click', () => this.switchTab('filters'));
        document.getElementById('resizeTab').addEventListener('click', () => this.switchTab('resize'));
        
        // Filter sliders
        const filterInputs = ['brightness', 'contrast', 'saturation', 'blur', 'sepia', 'grayscale'];
        filterInputs.forEach(filter => {
            const input = document.getElementById(filter);
            const valueSpan = document.getElementById(filter + 'Value');
            input.addEventListener('input', (e) => {
                valueSpan.textContent = e.target.value;
                this.applyFilters();
            });
        });
        
        // Resize inputs
        document.getElementById('newWidth').addEventListener('input', (e) => this.handleDimensionChange('width', e.target.value));
        document.getElementById('newHeight').addEventListener('input', (e) => this.handleDimensionChange('height', e.target.value));
        document.getElementById('applyResizeBtn').addEventListener('click', () => this.applyResize());
        
        // Canvas mouse events for cropping
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleCanvasMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleCanvasMouseUp());
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.originalImage = img;
                    this.aspectRatio = img.width / img.height;
                    this.setupCanvas(img);
                    this.showControls();
                    this.resetFilters();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
    setupCanvas(img) {
        // Calculate display size while maintaining aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        let displayWidth = img.width;
        let displayHeight = img.height;
        
        if (displayWidth > maxWidth) {
            displayHeight = (displayHeight * maxWidth) / displayWidth;
            displayWidth = maxWidth;
        }
        
        if (displayHeight > maxHeight) {
            displayWidth = (displayWidth * maxHeight) / displayHeight;
            displayHeight = maxHeight;
        }
        
        // Set canvas size to original image size for processing
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Set display size
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Draw image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
        
        // Store original image data
        this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Update resize inputs
        document.getElementById('newWidth').value = img.width;
        document.getElementById('newHeight').value = img.height;
        
        // Show canvas
        document.getElementById('uploadPrompt').classList.add('hidden');
        document.getElementById('canvasWrapper').classList.remove('hidden');
    }
    
    showControls() {
        document.getElementById('toolsSection').classList.remove('hidden');
        document.getElementById('controlsSection').classList.remove('hidden');
    }
    
    resetFilters() {
        const filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            sepia: 0,
            grayscale: 0
        };
        
        Object.keys(filters).forEach(filter => {
            const input = document.getElementById(filter);
            const valueSpan = document.getElementById(filter + 'Value');
            input.value = filters[filter];
            valueSpan.textContent = filters[filter];
        });
    }
    
    applyFilters() {
        if (!this.originalImageData) return;
        
        this.showProcessing(true);
        
        // Get filter values
        const brightness = document.getElementById('brightness').value;
        const contrast = document.getElementById('contrast').value;
        const saturation = document.getElementById('saturation').value;
        const blur = document.getElementById('blur').value;
        const sepia = document.getElementById('sepia').value;
        const grayscale = document.getElementById('grayscale').value;
        
        // Create temporary canvas for processing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.originalImageData.width;
        tempCanvas.height = this.originalImageData.height;
        
        // Put original image data
        tempCtx.putImageData(this.originalImageData, 0, 0);
        
        // Apply CSS filters
        tempCtx.filter = `
            brightness(${brightness}%) 
            contrast(${contrast}%) 
            saturate(${saturation}%) 
            blur(${blur}px) 
            sepia(${sepia}%) 
            grayscale(${grayscale}%)
        `;
        
        // Draw filtered image
        tempCtx.drawImage(tempCanvas, 0, 0);
        
        // Get filtered image data
        const filteredImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Apply to main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(filteredImageData, 0, 0);
        
        this.currentImageData = filteredImageData;
        this.showProcessing(false);
    }
    
    switchTab(tab) {
        const filtersTab = document.getElementById('filtersTab');
        const resizeTab = document.getElementById('resizeTab');
        const filtersPanel = document.getElementById('filtersPanel');
        const resizePanel = document.getElementById('resizePanel');
        
        if (tab === 'filters') {
            filtersTab.classList.add('bg-white/30');
            filtersTab.classList.remove('text-white/70');
            resizeTab.classList.remove('bg-white/30');
            resizeTab.classList.add('text-white/70');
            filtersPanel.classList.remove('hidden');
            resizePanel.classList.add('hidden');
        } else {
            resizeTab.classList.add('bg-white/30');
            resizeTab.classList.remove('text-white/70');
            filtersTab.classList.remove('bg-white/30');
            filtersTab.classList.add('text-white/70');
            resizePanel.classList.remove('hidden');
            filtersPanel.classList.add('hidden');
        }
    }
    
    handleDimensionChange(dimension, value) {
        const aspectRatioCheckbox = document.getElementById('aspectRatio');
        const widthInput = document.getElementById('newWidth');
        const heightInput = document.getElementById('newHeight');
        
        if (aspectRatioCheckbox.checked && this.aspectRatio) {
            if (dimension === 'width') {
                heightInput.value = Math.round(value / this.aspectRatio);
            } else {
                widthInput.value = Math.round(value * this.aspectRatio);
            }
        }
    }
    
    applyResize() {
        if (!this.originalImage) return;
        
        const newWidth = parseInt(document.getElementById('newWidth').value);
        const newHeight = parseInt(document.getElementById('newHeight').value);
        
        if (newWidth > 0 && newHeight > 0) {
            this.showProcessing(true);
            
            // Resize canvas
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            // Calculate new display size
            const maxWidth = 800;
            const maxHeight = 600;
            let displayWidth = newWidth;
            let displayHeight = newHeight;
            
            if (displayWidth > maxWidth) {
                displayHeight = (displayHeight * maxWidth) / displayWidth;
                displayWidth = maxWidth;
            }
            
            if (displayHeight > maxHeight) {
                displayWidth = (displayWidth * maxHeight) / displayHeight;
                displayHeight = maxHeight;
            }
            
            this.canvas.style.width = displayWidth + 'px';
            this.canvas.style.height = displayHeight + 'px';
            
            // Draw resized image
            this.ctx.clearRect(0, 0, newWidth, newHeight);
            this.ctx.drawImage(this.originalImage, 0, 0, newWidth, newHeight);
            
            // Update image data
            this.originalImageData = this.ctx.getImageData(0, 0, newWidth, newHeight);
            this.currentImageData = this.ctx.getImageData(0, 0, newWidth, newHeight);
            
            // Update aspect ratio
            this.aspectRatio = newWidth / newHeight;
            
            this.showProcessing(false);
        }
    }
    
    toggleCropMode() {
        this.cropMode = !this.cropMode;
        const cropBtn = document.getElementById('cropBtn');
        const cropInstruction = document.getElementById('cropInstruction');
        
        if (this.cropMode) {
            cropBtn.textContent = 'Exit Crop Mode';
            cropBtn.classList.remove('bg-white/20', 'hover:bg-white/30');
            cropBtn.classList.add('bg-red-500', 'hover:bg-red-600');
            cropInstruction.classList.remove('hidden');
            this.canvas.style.cursor = 'crosshair';
        } else {
            cropBtn.textContent = 'Crop Image';
            cropBtn.classList.add('bg-white/20', 'hover:bg-white/30');
            cropBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            cropInstruction.classList.add('hidden');
            this.canvas.style.cursor = 'default';
            document.getElementById('applyCropBtn').classList.add('hidden');
            this.cropStart = null;
            this.cropEnd = null;
            // Redraw image without crop overlay
            if (this.currentImageData) {
                this.ctx.putImageData(this.currentImageData, 0, 0);
            }
        }
    }
    
    handleCanvasMouseDown(e) {
        if (!this.cropMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.cropStart = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        this.isDragging = true;
    }
    
    handleCanvasMouseMove(e) {
        if (!this.cropMode || !this.isDragging || !this.cropStart) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.cropEnd = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        
        // Redraw image with crop overlay
        if (this.currentImageData) {
            this.ctx.putImageData(this.currentImageData, 0, 0);
            
            // Draw crop rectangle
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                Math.min(this.cropStart.x, this.cropEnd.x),
                Math.min(this.cropStart.y, this.cropEnd.y),
                Math.abs(this.cropEnd.x - this.cropStart.x),
                Math.abs(this.cropEnd.y - this.cropStart.y)
            );
        }
        
        // Show apply crop button
        document.getElementById('applyCropBtn').classList.remove('hidden');
    }
    
    handleCanvasMouseUp() {
        this.isDragging = false;
    }
    
    applyCrop() {
        if (!this.cropStart || !this.cropEnd || !this.currentImageData) return;
        
        const x = Math.min(this.cropStart.x, this.cropEnd.x);
        const y = Math.min(this.cropStart.y, this.cropEnd.y);
        const width = Math.abs(this.cropEnd.x - this.cropStart.x);
        const height = Math.abs(this.cropEnd.y - this.cropStart.y);
        
        if (width > 0 && height > 0) {
            this.showProcessing(true);
            
            // Get cropped image data
            const croppedImageData = this.ctx.getImageData(x, y, width, height);
            
            // Resize canvas to crop dimensions
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Calculate new display size
            const maxWidth = 800;
            const maxHeight = 600;
            let displayWidth = width;
            let displayHeight = height;
            
            if (displayWidth > maxWidth) {
                displayHeight = (displayHeight * maxWidth) / displayWidth;
                displayWidth = maxWidth;
            }
            
            if (displayHeight > maxHeight) {
                displayWidth = (displayWidth * maxHeight) / displayHeight;
                displayHeight = maxHeight;
            }
            
            this.canvas.style.width = displayWidth + 'px';
            this.canvas.style.height = displayHeight + 'px';
            
            // Draw cropped image
            this.ctx.putImageData(croppedImageData, 0, 0);
            
            // Update image data
            this.originalImageData = croppedImageData;
            this.currentImageData = croppedImageData;
            
            // Update resize dimensions
            document.getElementById('newWidth').value = width;
            document.getElementById('newHeight').value = height;
            
            // Update aspect ratio
            this.aspectRatio = width / height;
            
            // Exit crop mode
            this.toggleCropMode();
            
            this.showProcessing(false);
        }
    }
    
    resetImage() {
        if (!this.originalImage) return;
        
        this.setupCanvas(this.originalImage);
        this.resetFilters();
        
        // Exit crop mode if active
        if (this.cropMode) {
            this.toggleCropMode();
        }
    }
    
    downloadImage() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    showProcessing(show) {
        const overlay = document.getElementById('processingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Initialize the image editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageEditor();
});

