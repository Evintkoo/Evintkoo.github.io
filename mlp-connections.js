// MLP-like Network Connections for Technology Stack
class MLPConnections {
    constructor() {
        this.svg = document.querySelector('.connections-svg');
        this.nodes = document.querySelectorAll('.brick');
        this.connections = [];
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Wait for layout to be complete and ensure all elements are rendered
        setTimeout(() => {
            this.setupSVG();
            this.createConnections();
            this.bindEvents();
            this.isInitialized = true;
        }, 1500);
    }
    
    setupSVG() {
        if (!this.svg) return;
        
        // Set SVG to cover the entire diagram area
        const container = this.svg.parentElement;
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.pointerEvents = 'none';
        this.svg.style.zIndex = '1';
    }
    
    createConnections() {
        if (!this.svg) return;
        
        // Clear existing connections
        this.svg.innerHTML = '';
        this.connections = [];
        
        // Force reflow to ensure all elements are positioned
        this.svg.parentElement.offsetHeight;
        
        // Get nodes by layer
        const layers = {
            input: Array.from(document.querySelectorAll('[data-layer="input"]')),
            hidden1: Array.from(document.querySelectorAll('[data-layer="hidden1"]')),
            hidden2: Array.from(document.querySelectorAll('[data-layer="hidden2"]')),
            output: Array.from(document.querySelectorAll('[data-layer="output"]'))
        };
        
        // Create connections between layers with a small delay to ensure proper positioning
        setTimeout(() => {
            this.connectLayers(layers.input, layers.hidden1);
            this.connectLayers(layers.hidden1, layers.hidden2);
            this.connectLayers(layers.hidden2, layers.output);
        }, 100);
    }
    
    connectLayers(sourceLayer, targetLayer) {
        sourceLayer.forEach(sourceNode => {
            targetLayer.forEach(targetNode => {
                this.createConnection(sourceNode, targetNode);
            });
        });
    }
    
    createConnection(sourceNode, targetNode) {
        // Get the diagram container for reference
        const diagramContainer = this.svg.parentElement;
        const containerRect = diagramContainer.getBoundingClientRect();
        
        // Get the actual node positions
        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        
        // Calculate center positions relative to the diagram container
        const sourceX = (sourceRect.left + sourceRect.width / 2) - containerRect.left;
        const sourceY = (sourceRect.top + sourceRect.height / 2) - containerRect.top;
        const targetX = (targetRect.left + targetRect.width / 2) - containerRect.left;
        const targetY = (targetRect.top + targetRect.height / 2) - containerRect.top;
        
        // Calculate edge points on the circles (for cleaner connections)
        const radius = 50; // Half of the node size (100px)
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate connection points on the edge of circles
        const sourceEdgeX = sourceX + (dx / distance) * radius;
        const sourceEdgeY = sourceY + (dy / distance) * radius;
        const targetEdgeX = targetX - (dx / distance) * radius;
        const targetEdgeY = targetY - (dy / distance) * radius;
        
        // Create SVG line element
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceEdgeX);
        line.setAttribute('y1', sourceEdgeY);
        line.setAttribute('x2', targetEdgeX);
        line.setAttribute('y2', targetEdgeY);
        line.setAttribute('class', 'connection-line');
        line.setAttribute('data-source', sourceNode.dataset.tech);
        line.setAttribute('data-target', targetNode.dataset.tech);
        
        this.svg.appendChild(line);
        
        this.connections.push({
            line: line,
            source: sourceNode,
            target: targetNode
        });
    }
    
    bindEvents() {
        this.nodes.forEach(node => {
            node.addEventListener('mouseenter', (e) => {
                this.highlightConnections(e.target);
            });
            
            node.addEventListener('mouseleave', (e) => {
                this.clearHighlights();
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.createConnections();
            }, 250);
        });
    }
    
    highlightConnections(activeNode) {
        const activeTech = activeNode.dataset.tech;
        
        // Clear previous highlights
        this.clearHighlights();
        
        // Add active class to hovered node
        activeNode.classList.add('connection-active');
        
        // Highlight related connections
        this.connections.forEach(connection => {
            const { line, source, target } = connection;
            
            if (source.dataset.tech === activeTech) {
                line.classList.add('active');
                target.classList.add('connection-target');
                source.classList.add('connection-source');
            } else if (target.dataset.tech === activeTech) {
                line.classList.add('active');
                source.classList.add('connection-source');
                target.classList.add('connection-target');
            }
        });
    }
    
    clearHighlights() {
        // Remove all highlight classes
        this.nodes.forEach(node => {
            node.classList.remove('connection-active', 'connection-source', 'connection-target');
        });
        
        // Remove active class from lines
        const activeLines = this.svg.querySelectorAll('.connection-line.active');
        activeLines.forEach(line => {
            line.classList.remove('active');
        });
    }
    
    // Animate connections on scroll
    animateOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.playConnectionAnimation();
                }
            });
        }, { threshold: 0.3 });
        
        if (this.svg) {
            observer.observe(this.svg.parentElement);
        }
    }
    
    playConnectionAnimation() {
        const lines = this.svg.querySelectorAll('.connection-line');
        lines.forEach((line, index) => {
            line.style.strokeDasharray = '5,5';
            line.style.strokeDashoffset = '10';
            line.style.animation = `dashAnimation 2s linear infinite`;
            line.style.animationDelay = `${index * 0.1}s`;
        });
    }
}

// CSS animation for dashing effect
const style = document.createElement('style');
style.textContent = `
    @keyframes dashAnimation {
        0% {
            stroke-dashoffset: 10;
        }
        100% {
            stroke-dashoffset: 0;
        }
    }
    
    .connection-line {
        transition: stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease;
    }
    
    .connection-line.active {
        animation: pulse 1.5s ease-in-out infinite alternate;
    }
    
    @keyframes pulse {
        0% {
            stroke-width: 2;
            opacity: 1;
        }
        100% {
            stroke-width: 4;
            opacity: 0.8;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mlpConnections = new MLPConnections();
    mlpConnections.animateOnScroll();
});

// Re-initialize on theme changes or dynamic content updates
document.addEventListener('theme-changed', () => {
    setTimeout(() => {
        const mlpConnections = new MLPConnections();
    }, 100);
});