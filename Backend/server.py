import geopandas as gpd 
import folium
from flask import Flask, render_template

# Create Flask instance named 'server'
server = Flask(__name__)  # This is your Flask application instance

# Use @server.route instead of @app.route
@server.route('/')  # Changed from @app.route
def show_map():
    map = folium.Map(location=[13.13455, -59.62983], zoom_start=15)
    folium.Marker([13.13455, -59.62983], popup='cavehill').add_to(map)
    return map._repr_html_()

if __name__ == '__main__':
    server.run(debug=True)  # Run the server instance