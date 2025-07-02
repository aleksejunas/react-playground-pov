import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Circle from "ol/style/Circle";
import Style from "ol/style/Style";
import { Fill, Stroke, Text } from "ol/style";
import "ol/ol.css";
import "./PhaseOutMapScreen.css";

type Field = {
  name: string;
  lon: number;
  lat: number;
  emissions: number[];
  intensity: number;
  status: "active" | "closed" | "transitioning";
  production: number;
  workers: number;
  phaseOutCost: number;
};

const fields: Field[] = [
  {
    name: "Skarv",
    lon: 7.5,
    lat: 65.5,
    emissions: [10, 9, 8, 6, 5],
    intensity: 8,
    status: "active",
    production: 40,
    workers: 120,
    phaseOutCost: 50,
  },
  {
    name: "Troll",
    lon: 4.0,
    lat: 61.0,
    emissions: [20, 18, 16, 12, 9],
    intensity: 9,
    status: "active",
    production: 65,
    workers: 200,
    phaseOutCost: 80,
  },
  {
    name: "Åsgard",
    lon: 7.0,
    lat: 64.0,
    emissions: [15, 13, 11, 8, 5],
    intensity: 7,
    status: "active",
    production: 45,
    workers: 150,
    phaseOutCost: 60,
  },
  {
    name: "Gullfaks",
    lon: 2.5,
    lat: 61.2,
    emissions: [12, 10, 8, 6, 3],
    intensity: 6,
    status: "active",
    production: 35,
    workers: 100,
    phaseOutCost: 45,
  },
  {
    name: "Statfjord",
    lon: 1.8,
    lat: 61.8,
    emissions: [18, 15, 12, 8, 4],
    intensity: 8,
    status: "active",
    production: 55,
    workers: 180,
    phaseOutCost: 70,
  },
];

const getColorForIntensity = (
  intensity: number,
  status: Field["status"],
): string => {
  if (status === "closed") return "#10B981";
  if (status === "transitioning") return "#F59E0B";
  if (intensity > 8) return "#EF4444";
  if (intensity > 5) return "#F97316";
  return "#22C55E";
};

const PhaseOutVillageGame = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [score, setScore] = useState(100);
  const [budget, setBudget] = useState(200);
  const [year, setYear] = useState(2025);
  const [gameFields, setGameFields] = useState<Field[]>(fields);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalProduction, setTotalProduction] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    const emissions = gameFields.reduce(
      (sum, field) =>
        field.status === "active" ? sum + field.emissions[0] : sum,
      0,
    );
    const production = gameFields.reduce(
      (sum, field) =>
        field.status === "active" ? sum + field.production : sum,
      0,
    );
    setTotalEmissions(emissions);
    setTotalProduction(production);
  }, [gameFields]);

  useEffect(() => {
    if (!mapRef.current) return;
    const vectorSource = new VectorSource({
      features: gameFields.map((field) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([field.lon, field.lat])),
          name: field.name,
          fieldData: field,
        });
        const color = getColorForIntensity(field.intensity, field.status);
        const size = field.status === "closed" ? 8 : 12;
        feature.setStyle(
          new Style({
            image: new Circle({
              radius: size,
              fill: new Fill({ color: color }),
              stroke: new Stroke({ color: "#FFFFFF", width: 3 }),
            }),
            text: new Text({
              text: field.status === "closed" ? "🌱" : "🛢️",
              offsetY: -25,
              font: "20px sans-serif",
            }),
          }),
        );
        return feature;
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
            attributions: "&copy; OpenStreetMap contributors & Carto",
            maxZoom: 19,
          }),
        }),
        new VectorLayer({ source: vectorSource }),
      ],
      view: new View({
        center: fromLonLat([5, 62]),
        zoom: 6,
      }),
      controls: [],
    });

    map.on("singleclick", function (evt) {
      map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        const fieldData = feature.get("fieldData");
        setSelectedField(fieldData);
        setShowFieldModal(true);
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
      }
    };
  }, [gameFields]);

  const phaseOutField = (fieldName: string) => {
    const field = gameFields.find((f) => f.name === fieldName);
    if (!field || budget < field.phaseOutCost) return;
    setBudget((prev) => prev - field.phaseOutCost);
    setScore((prev) => prev + 50);
    setGameFields((prev) =>
      prev.map((f) =>
        f.name === fieldName ? { ...f, status: "closed", production: 0 } : f,
      ),
    );
    if (!achievements.includes("First Phase Out")) {
      setAchievements((prev) => [...prev, "First Phase Out"]);
    }
    setShowFieldModal(false);
    setSelectedField(null);
  };

  const progressToTarget = Math.min(
    100,
    ((fields.length - gameFields.filter((f) => f.status === "active").length) /
      fields.length) *
      100,
  );

  return (
    <div className="container">
      {/* JSX fortsetter med className-er fra CSS-fila */}
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <h1 className="title">🌍 PHASE OUT VILLAGE</h1>
          <div className="year-badge">TIL 2040!</div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressToTarget}%` }}
          />
        </div>

        {/* Game Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-card-green">
            <div className="stat-emoji">🌱</div>
            <div className="stat-value" style={{ color: "#166534" }}>
              {score}
            </div>
            <div className="stat-label" style={{ color: "#16A34A" }}>
              Klimapoeng
            </div>
          </div>
          <div className="stat-card stat-card-yellow">
            <div className="stat-emoji">💰</div>
            <div className="stat-value" style={{ color: "#92400E" }}>
              {budget} mrd
            </div>
            <div className="stat-label" style={{ color: "#D97706" }}>
              Budsjett
            </div>
          </div>
          <div className="stat-card stat-card-blue">
            <div className="stat-emoji">📅</div>
            <div className="stat-value" style={{ color: "#1E40AF" }}>
              {year}
            </div>
            <div className="stat-label" style={{ color: "#2563EB" }}>
              År
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        <h2 className="map-title">🗺️ Oljeområder</h2>
        <div ref={mapRef} className="map-div" />
        <div className="map-hint">
          Klikk på et oljefelt for å fase det ut! 🛢️ → 🌱
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="dashboard-title">📊 Utslipp</h3>
          <div className="dashboard-value">{totalEmissions.toFixed(1)} Mt</div>
          <div className="dashboard-label">CO₂ per år</div>
          <div className="progress-bar-small">
            <div
              className="progress-fill-red"
              style={{
                width: `${Math.min(100, (totalEmissions / 85) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="dashboard-title">⚡ Produksjon</h3>
          <div className="dashboard-value-orange">
            {totalProduction.toFixed(0)} TWh
          </div>
          <div className="dashboard-label">per år</div>
          <div className="progress-bar-small">
            <div
              className="progress-fill-orange"
              style={{
                width: `${Math.min(100, (totalProduction / 240) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="achievement-card">
          <h3 className="achievement-title">🏆 Prestasjoner</h3>
          <div className="achievement-list">
            {achievements.map((achievement, index) => (
              <span key={index} className="achievement-badge">
                {achievement}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && selectedField && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="modal-title">🛢️ {selectedField.name}</h3>

            {selectedField.status === "active" ? (
              <>
                <div className="modal-stats">
                  <div className="modal-stat-row">
                    <span>Utslipp:</span>
                    <span
                      className="modal-stat-value"
                      style={{ color: "#DC2626" }}
                    >
                      {selectedField.emissions[0]} Mt/år
                    </span>
                  </div>
                  <div className="modal-stat-row">
                    <span>Produksjon:</span>
                    <span
                      className="modal-stat-value"
                      style={{ color: "#EA580C" }}
                    >
                      {selectedField.production} TWh/år
                    </span>
                  </div>
                  <div className="modal-stat-row">
                    <span>Arbeidere:</span>
                    <span className="modal-stat-value">
                      {selectedField.workers}
                    </span>
                  </div>
                  <div className="modal-stat-row">
                    <span>Kostnad å fase ut:</span>
                    <span
                      className="modal-stat-value"
                      style={{ color: "#2563EB" }}
                    >
                      {selectedField.phaseOutCost} mrd
                    </span>
                  </div>
                </div>

                <div className="modal-buttons">
                  <button
                    onClick={() => phaseOutField(selectedField.name)}
                    disabled={budget < selectedField.phaseOutCost}
                    className={`button-phase-out ${
                      budget >= selectedField.phaseOutCost
                        ? "button-phase-out-enabled"
                        : "button-phase-out-disabled"
                    }`}
                  >
                    FASE UT
                  </button>
                  <button
                    onClick={() => setShowFieldModal(false)}
                    className="button-cancel"
                  >
                    AVBRYT
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="closed-message">
                  <div className="closed-emoji">🌱</div>
                  <p className="closed-text">Dette feltet er faset ut!</p>
                  <p className="closed-subtext">
                    Null utslipp, null produksjon. Bra jobbet! 🎉
                  </p>
                </div>
                <button
                  onClick={() => setShowFieldModal(false)}
                  className="button-ok"
                >
                  OK
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseOutVillageGame;
