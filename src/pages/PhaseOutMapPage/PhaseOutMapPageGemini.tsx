import React, {
  useEffect,
  useRef,
  useState,
  useReducer,
  useCallback,
} from "react";
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
import "ol/ol.css"; // OpenLayers default CSS
import "./PhaseOutMapScreen.css"; // Your custom CSS

// --- Types ---
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

type GameState = {
  gameFields: Field[];
  budget: number;
  score: number;
  year: number;
  selectedField: Field | null;
  showFieldModal: boolean;
  achievements: string[];
  totalEmissions: number;
  totalProduction: number;
};

type GameAction =
  | { type: "PHASE_OUT_FIELD"; payload: string }
  | { type: "SET_SELECTED_FIELD"; payload: Field | null }
  | { type: "TOGGLE_FIELD_MODAL"; payload: boolean }
  | { type: "UPDATE_EMISSIONS_PRODUCTION" }
  | { type: "LOAD_GAME_STATE"; payload: GameState } // Useful for initial load if needed
  | { type: "ADD_ACHIEVEMENT"; payload: string }
  | { type: "ADVANCE_YEAR"; payload?: number };

// --- Constants ---
const LOCAL_STORAGE_KEY = "phaseOutGameState";
const LOCAL_STORAGE_THEME_KEY = "userPreferredTheme"; // New key for user's theme preference
const ACHIEVEMENT_FIRST_PHASE_OUT = "First Phase Out";

const INITIAL_GAME_FIELDS: Field[] = [
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

const INITIAL_BUDGET = 250;
const INITIAL_SCORE = 100;
const INITIAL_YEAR = 2025;
const DEFAULT_MAP_CENTER = [5, 62];
const DEFAULT_MAP_ZOOM = 6;
const MAX_EMISSIONS_DISPLAY = 85; // For progress bar width calculation
const MAX_PRODUCTION_DISPLAY = 240; // For progress bar width calculation

// --- Utility Functions ---
const isValidField = (f: any): f is Field => {
  return (
    typeof f.name === "string" &&
    typeof f.lon === "number" &&
    typeof f.lat === "number" &&
    Array.isArray(f.emissions) &&
    f.emissions.every((e: any) => typeof e === "number") &&
    typeof f.intensity === "number" &&
    ["active", "closed", "transitioning"].includes(f.status) &&
    typeof f.production === "number" &&
    typeof f.workers === "number" &&
    typeof f.phaseOutCost === "number"
  );
};

const loadGameState = (): GameState => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && saved.length <= 100000) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        Array.isArray(parsed.gameFields) &&
        typeof parsed.budget === "number" &&
        typeof parsed.score === "number" &&
        typeof parsed.year === "number" &&
        parsed.gameFields.every(isValidField)
      ) {
        return {
          ...parsed,
          selectedField: parsed.selectedField || null,
          showFieldModal: parsed.showFieldModal || false,
          achievements: parsed.achievements || [],
          totalEmissions: parsed.totalEmissions || 0,
          totalProduction: parsed.totalProduction || 0,
        };
      }
    }
  } catch (e) {
    console.error("Failed to load game state from localStorage:", e);
  }

  return {
    gameFields: INITIAL_GAME_FIELDS,
    budget: INITIAL_BUDGET,
    score: INITIAL_SCORE,
    year: INITIAL_YEAR,
    selectedField: null,
    showFieldModal: false,
    achievements: [],
    totalEmissions: 0,
    totalProduction: 0,
  };
};

const getColorForIntensity = (
  intensity: number,
  status: Field["status"],
): string => {
  if (status === "closed") return "#10B981"; // Tailwind green-500
  if (status === "transitioning") return "#F59E0B"; // Tailwind amber-500
  if (intensity > 8) return "#EF4444"; // Tailwind red-500
  if (intensity > 5) return "#F97316"; // Tailwind orange-500
  return "#22C55E"; // Tailwind green-600
};

// --- Reducer ---
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "LOAD_GAME_STATE":
      return { ...state, ...action.payload };
    case "PHASE_OUT_FIELD": {
      const fieldName = action.payload;
      const field = state.gameFields.find((f) => f.name === fieldName);
      if (!field || state.budget < field.phaseOutCost) return state;

      const newBudget = state.budget - field.phaseOutCost;
      const newScore = state.score + 50;
      const newGameFields = state.gameFields.map((f) =>
        f.name === fieldName ? { ...f, status: "closed", production: 0 } : f,
      );

      let newAchievements = state.achievements;
      if (!newAchievements.includes(ACHIEVEMENT_FIRST_PHASE_OUT)) {
        newAchievements = [...newAchievements, ACHIEVEMENT_FIRST_PHASE_OUT];
      }

      return {
        ...state,
        budget: newBudget,
        score: newScore,
        gameFields: newGameFields,
        showFieldModal: false,
        selectedField: null,
        achievements: newAchievements,
        year: state.year + 1, // Advance year automatically after phase out
      };
    }
    case "SET_SELECTED_FIELD":
      return { ...state, selectedField: action.payload };
    case "TOGGLE_FIELD_MODAL":
      return { ...state, showFieldModal: action.payload };
    case "UPDATE_EMISSIONS_PRODUCTION": {
      const emissions = state.gameFields.reduce(
        (sum, field) =>
          field.status === "active" ? sum + field.emissions[0] : sum,
        0,
      );
      const production = state.gameFields.reduce(
        (sum, field) =>
          field.status === "active" ? sum + field.production : sum,
        0,
      );
      return {
        ...state,
        totalEmissions: emissions,
        totalProduction: production,
      };
    }
    case "ADVANCE_YEAR":
      return { ...state, year: state.year + (action.payload || 1) };
    case "ADD_ACHIEVEMENT":
      if (!state.achievements.includes(action.payload)) {
        return {
          ...state,
          achievements: [...state.achievements, action.payload],
        };
      }
      return state;
    default:
      return state;
  }
};

// --- Theme Context (Adjusted for CSS prefers-color-scheme) ---
type ThemePreference = "light" | "dark" | "system"; // 'system' means let CSS handle it

interface ThemeContextType {
  themePreference: ThemePreference;
  toggleThemePreference: () => void;
  // We'll also expose the *actual* theme derived from system/preference for display purposes
  currentTheme: "light" | "dark";
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
);

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// --- Nested FieldModal Component ---
interface FieldModalProps {
  selectedField: Field | null;
  budget: number;
  onPhaseOut: (fieldName: string) => void;
  onClose: () => void;
}

const FieldModal: React.FC<FieldModalProps> = ({
  selectedField,
  budget,
  onPhaseOut,
  onClose,
}) => {
  if (!selectedField) return null;

  const canPhaseOut = budget >= selectedField.phaseOutCost;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3 className="modal-title">🛢️ {selectedField.name}</h3>

        {selectedField.status === "active" ? (
          <>
            <div className="modal-stats">
              <div className="modal-stat-row">
                <span>Utslipp:</span>
                <span className="modal-stat-value" style={{ color: "#DC2626" }}>
                  {selectedField.emissions[0]} Mt/år
                </span>
              </div>
              <div className="modal-stat-row">
                <span>Produksjon:</span>
                <span className="modal-stat-value" style={{ color: "#EA580C" }}>
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
                <span className="modal-stat-value" style={{ color: "#2563EB" }}>
                  {selectedField.phaseOutCost} mrd
                </span>
              </div>
            </div>

            <div className="modal-buttons">
              <button
                onClick={() => onPhaseOut(selectedField.name)}
                disabled={!canPhaseOut}
                className={`button-phase-out ${
                  canPhaseOut
                    ? "button-phase-out-enabled"
                    : "button-phase-out-disabled"
                }`}
              >
                FASE UT
              </button>
              <button onClick={onClose} className="button-cancel">
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
            <button onClick={onClose} className="button-ok">
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Game Component ---
const PhaseOutVillageGame = () => {
  const [gameState, dispatch] = useReducer(gameReducer, loadGameState());
  const {
    gameFields,
    budget,
    score,
    year,
    selectedField,
    showFieldModal,
    achievements,
    totalEmissions,
    totalProduction,
  } = gameState;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // Theme preference state
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    () => {
      // Read from localStorage, default to 'system'
      return (
        (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as ThemePreference) ||
        "system"
      );
    },
  );

  // Determine actual theme based on preference and system setting
  const currentTheme = React.useMemo(() => {
    if (themePreference === "light") return "light";
    if (themePreference === "dark") return "dark";
    // If 'system', check prefers-color-scheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, [themePreference]);

  const toggleThemePreference = useCallback(() => {
    setThemePreference((prevPref) => {
      let newPref: ThemePreference;
      if (prevPref === "system" || prevPref === "light") {
        newPref = "dark";
      } else {
        newPref = "light";
      }
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newPref);
      return newPref;
    });
  }, []);

  // Effect for saving game state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Effect for calculating total emissions and production
  useEffect(() => {
    dispatch({ type: "UPDATE_EMISSIONS_PRODUCTION" });
  }, [gameFields]);

  // Effect for OpenLayers Map initialization and updates
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: "https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
              attributions: "&copy; OpenStreetMap contributors & Carto",
              maxZoom: 19,
            }),
          }),
        ],
        view: new View({
          center: fromLonLat(DEFAULT_MAP_CENTER),
          zoom: DEFAULT_MAP_ZOOM,
        }),
        controls: [],
      });

      mapInstanceRef.current.on("singleclick", function (evt) {
        mapInstanceRef.current?.forEachFeatureAtPixel(
          evt.pixel,
          function (feature) {
            const fieldData = feature.get("fieldData");
            if (fieldData) {
              dispatch({ type: "SET_SELECTED_FIELD", payload: fieldData });
              dispatch({ type: "TOGGLE_FIELD_MODAL", payload: true });
            }
          },
        );
      });
    }

    const map = mapInstanceRef.current;
    let vectorLayer = map
      .getLayers()
      .getArray()
      .find((layer) => layer instanceof VectorLayer) as VectorLayer | undefined;

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

    if (vectorLayer) {
      vectorLayer.setSource(vectorSource);
    } else {
      vectorLayer = new VectorLayer({ source: vectorSource });
      map.addLayer(vectorLayer);
    }

    return () => {
      if (mapInstanceRef.current && !mapRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [gameFields]);

  const phaseOutField = useCallback((fieldName: string) => {
    dispatch({ type: "PHASE_OUT_FIELD", payload: fieldName });
  }, []);

  const progressToTarget = React.useMemo(() => {
    return gameFields && gameFields.length > 0
      ? Math.min(
          100,
          ((gameFields.length -
            gameFields.filter((f) => f.status === "active").length) /
            gameFields.length) *
            100,
        )
      : 0;
  }, [gameFields]);

  return (
    // Providing theme context with actual theme and toggle for preference
    <ThemeContext.Provider
      value={{ themePreference, toggleThemePreference, currentTheme }}
    >
      <div
        className="container"
        style={{
          filter: `grayscale(${Math.min(1, (year - INITIAL_YEAR) / 10)})`,
          transition: "filter 0.5s",
        }}
      >
        {/* Header */}
        <div className="header">
          <div className="header-top">
            <h1 className="title">🌍 PHASE OUT VILLAGE</h1>
            <div className="year-badge">TIL 2040!</div>
            <button
              onClick={toggleThemePreference}
              className="theme-toggle-button"
            >
              Toggle {currentTheme === "light" ? "Dark" : "Light"} Mode
            </button>
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
            <div className="dashboard-value">
              {totalEmissions.toFixed(1)} Mt
            </div>
            <div className="dashboard-label">CO₂ per år</div>
            <div className="progress-bar-small">
              <div
                className="progress-fill-red"
                style={{
                  width: `${Math.min(100, (totalEmissions / MAX_EMISSIONS_DISPLAY) * 100)}%`,
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
                  width: `${Math.min(100, (totalProduction / MAX_PRODUCTION_DISPLAY) * 100)}%`,
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
        <FieldModal
          selectedField={selectedField}
          budget={budget}
          onPhaseOut={phaseOutField}
          onClose={() =>
            dispatch({ type: "TOGGLE_FIELD_MODAL", payload: false })
          }
        />
      </div>
    </ThemeContext.Provider>
  );
};

export default PhaseOutVillageGame;
