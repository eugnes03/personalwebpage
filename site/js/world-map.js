// Location Map Component
// Shows US and Norway with highlighted cities

(function() {
    class LocationMap {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;
            this.init();
        }

        init() {
            // Create the map container with SVG
            this.container.innerHTML = `
                <div class="location-map">
                    <div class="map-regions">
                        <div class="map-region usa">
                            <svg viewBox="0 0 100 60" class="region-outline">
                                <!-- Simplified USA outline -->
                                <path d="M5,20 L15,15 L25,12 L35,10 L45,8 L55,10 L65,12 L75,15 L85,18 L90,25 L92,35 L88,42 L80,45 L70,48 L60,50 L50,48 L40,50 L30,48 L20,45 L12,40 L8,32 L5,25 Z"
                                      fill="none" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>
                            </svg>
                            <div class="location-marker usa-marker" style="left: 78%; top: 35%;">
                                <div class="marker-pulse"></div>
                                <div class="marker-dot"></div>
                            </div>
                            <span class="region-label">Boston</span>
                        </div>

                        <div class="connection-line">
                            <svg viewBox="0 0 60 20" preserveAspectRatio="none">
                                <path d="M0,10 Q30,0 60,10" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
                            </svg>
                        </div>

                        <div class="map-region norway">
                            <svg viewBox="0 0 40 80" class="region-outline">
                                <!-- Simplified Norway outline -->
                                <path d="M20,5 L25,10 L28,20 L30,35 L28,50 L25,60 L22,70 L18,75 L15,70 L12,60 L10,45 L12,30 L15,15 L18,8 Z"
                                      fill="none" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>
                            </svg>
                            <div class="location-marker norway-marker" style="left: 55%; top: 75%;">
                                <div class="marker-pulse"></div>
                                <div class="marker-dot"></div>
                            </div>
                            <span class="region-label">Oslo</span>
                        </div>
                    </div>
                </div>
            `;
        }

    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        const mapContainer = document.getElementById('world-map');
        if (mapContainer) {
            new LocationMap('world-map');
        }
    });
})();
