// Tech Tag Animation Script
// Adds SVG border animation to project tech tags

document.addEventListener('DOMContentLoaded', function() {
    // Function to create SVG element for border animation
    function createAnimatedBorderSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        
        // Set SVG attributes
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // Set rectangle attributes for border animation
        rect.setAttribute('x', '1');
        rect.setAttribute('y', '1');
        rect.setAttribute('width', '98');
        rect.setAttribute('height', '98');
        rect.setAttribute('rx', '6'); // Rounded corners to match border-radius
        
        svg.appendChild(rect);
        return svg;
    }
    
    // Add animated border to all project tech tags
    const techTags = document.querySelectorAll('.project__tech-tag');
    techTags.forEach(tag => {
        const svg = createAnimatedBorderSVG();
        tag.appendChild(svg);
    });
    
    // Add animated border to all project tech spans (simple pattern)
    const techSpans = document.querySelectorAll('.project__tech span');
    techSpans.forEach(span => {
        const svg = createAnimatedBorderSVG();
        span.appendChild(svg);
    });
    
    console.log(`Added animated borders to ${techTags.length} tech tags and ${techSpans.length} tech spans`);
});