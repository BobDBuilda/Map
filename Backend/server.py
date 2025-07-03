import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS 
from flask_socketio import SocketIO, emit
from rapidfuzz import fuzz
from pymongo.mongo_client import MongoClient 

uri = "mongodb+srv://root:nobodyguessit@map.vqlmm4n.mongodb.net/?retryWrites=true&w=majority&appName=Map"

# Create a new client and connect to the server
client = MongoClient(uri)

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)


server = Flask(__name__, static_folder='static') 
server.config['SECRET KEY'] = 'secret'
socketio = SocketIO(server)
CORS(server)


@server.route('/', methods=['POST', 'GET'])
def index():
    return render_template('index.html')

@socketio.on('send_coordinates')
def handle_coordinates(data):
    lat = data.get('lat')
    lon = data.get('lon')
    print(f"Received coordinates: lat={lat}, lon={lon}")
    data = {
        'lat': lat,
        'lon': lon
    }

    emit('coordinates_received', {'status': 'ok'}, room=request.sid)

@server.route('/search',  methods=['POST'])
def search():
    #query = request.form.get('search-query').strip().lower()
    data = request.get_json()
    query = data.get('query', '').strip().lower()
    print(f"this is the query: {query}")

    if not query:
        return jsonify({'error': 'empty query'}), 400

    best_match = None
    best_score = 0

    try:
        data = pd.read_csv("Buildings.csv")
        for index, row in data.iterrows():
            score = fuzz.ratio(query, row['Name'].lower())
            if score > best_score:
                best_score = score
                best_match = row

        if best_score < 20:
            return jsonify({'error': 'no good match found'}), 404

        print(f"this is some data: {best_match['Name']}")
        return jsonify({
            'name': best_match['Name'],
            'lat': best_match['Latitude'],
            'lon': best_match['Longitude'],
            'score': best_score
        })
            #if row['Name'].lower() == search_query.lower(): 
             #   try:
             #       building = row['Name']
              #      lat = float(row['Latitude'])
              #      lng = float(row['Longitude'])
              #      print("after try block")
              #      return (building, lat, lng)
              #  except():
              #      continue
        
        #return None
    except FileNotFoundError:
        print(f"Error: File {data} not found")
        return None
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None

def truncate(number, decimals=0):
    if decimals < 0:
        raise ValueError("Decimal places must be non-negative")
    
    factor = 10.0 ** decimals
    return int(number * factor) / factor

@server.route('/settings', methods=['GET', 'POST'])
def settings():
    return render_template('settings.html')

@server.route('/check_user_location', methods=['POST'])
def check_user_location():
    gdf = gpd.read_file('map.geojson')  # loads into GeoDataFrame
    campus_polygon = gdf.geometry.unary_union  # handle multi-polygons if any

    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')

    point = Point(float(lon), float(lat))

    on_campus = campus_polygon.contains(point)
    return jsonify({"onCampus": on_campus})

@server.route('/account', methods=['POST', 'GET'])
def account():
    return render_template('account.html')

def build_graph(center_lat, center_lon, radius=3000):
    return ox.graph_from_point((center_lat, center_lon),
                                dist=radius,
                                network_type='drive')

@server.route('/route/<float:olat>/<float:olon>/<float:dlat>/<float:dlon>', methods=['GET'])
def route(origin_lat, origin_lon, dest_lat, dest_lon):
    center = ((origin_lat + dest_lat)/2, (origin_lon + dest_lon)/2)
    G = build_graph(*center)

    o_node = ox.nearest_nodes(G, origin_lon, origin_lat)
    d_node = ox.nearest_nodes(G, dest_lon, dest_lat)

    node_list = nx.shortest_path(G, o_node, d_node, weight='length')

    geoms = ox.utils_graph.get_route_edge_attributes(G, node_list, "geometry")
    gdf = gpd.GeoSeries(geoms, crs="EPSG:4326").to_frame("geometry")

    return jsonify(gdf.__geo_interface__)









if __name__ == '__main__':
    socketio.run(server, debug=True)  # Run the server instance


CORS(server, resources={r"/*": {"origins": "*"}})
