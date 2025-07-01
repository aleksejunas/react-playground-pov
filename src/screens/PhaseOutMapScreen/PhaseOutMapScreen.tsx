// React + OpenLayers + Chart.js eksempel (for Phase Out Village)

import React, { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Icon from "ol/style/Icon";
import Style from "ol/style/Style";
import "ol/ol.css";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
);

const fields = [
  { name: "Skarv", lon: 7.5, lat: 65.5, emissions: [10, 9, 8, 6, 5] },
  { name: "Troll", lon: 4.0, lat: 61.0, emissions: [20, 18, 16, 12, 9] },
  { name: "Åsgard", lon: 7.0, lat: 64.0, emissions: [15, 13, 11, 8, 5] },
];

const PhaseOutMapScreen = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mapRef.current || !chartRef.current) return;

    const vectorSource = new VectorSource({
      features: fields.map((field) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([field.lon, field.lat])),
          name: field.name,
        });
        feature.setStyle(
          new Style({
            image: new Icon({
              src: "/icons/oilfield.svg", // eller bruk en grønn/rød pin
              scale: 0.05,
            }),
          }),
        );
        return feature;
      }),
    });

    new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=YOUR_KEY",
          }),
        }),
        new VectorLayer({ source: vectorSource }),
      ],
      view: new View({
        center: fromLonLat([6, 63]),
        zoom: 4.8,
      }),
    });

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["2027", "2029", "2031", "2033", "2040"],
        datasets: fields.map((field) => ({
          label: field.name,
          data: field.emissions,
          borderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Utslipp per felt mot 2040",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "CO₂-utslipp (mill. tonn)",
            },
          },
        },
      },
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div ref={mapRef} style={{ height: "300px", width: "100%" }}></div>
      <canvas ref={chartRef} height="200"></canvas>
    </div>
  );
};

export default PhaseOutMapScreen;
