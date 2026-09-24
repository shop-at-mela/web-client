import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { getMapProviderApiAccess } from '../../util/maps';
import { ensureMapboxLoaded } from '../../util/includeScripts';
import * as mapboxMap from './MapboxMap';
import * as googleMapsMap from './GoogleMap';

import css from './Map.module.css';

/**
 * Map component that uses StaticMap or DynamicMap from the configured map provider: Mapbox or Google Maps
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.mapRootClassName add style rules for the root container
 * @param {string?} props.address
 * @param {Object} props.center LatLng
 * @param {number} props.center.lat latitude
 * @param {number} props.center.lng longitude
 * @param {Object} props.obfuscatedCenter LatLng
 * @param {number} props.obfuscatedCenter.lat latitude
 * @param {number} props.obfuscatedCenter.lng longitude
 * @param {number} props.zoom
 * @param {Object} props.mapsConfig
 * @param {boolean} props.useStaticMap
 * @returns {JSX.Element} Map component
 */
export const Map = props => {
  const config = useConfiguration();
  const {
    className,
    rootClassName,
    mapRootClassName,
    address,
    center,
    obfuscatedCenter,
    zoom,
    mapsConfig,
    useStaticMap,
  } = props;
  const mapsConfiguration = mapsConfig || config.maps;
  const hasApiAccessForMapProvider = !!getMapProviderApiAccess(mapsConfiguration);
  const isGoogleMapsInUse = mapsConfiguration.mapProvider === 'googleMaps';
  const StaticMap = isGoogleMapsInUse ? googleMapsMap.StaticMap : mapboxMap.StaticMap;
  const DynamicMap = isGoogleMapsInUse ? googleMapsMap.DynamicMap : mapboxMap.DynamicMap;

  // Mapbox's script/CSS may not have been injected on this page load (e.g. the
  // visitor landed on a route that never shows a map — see `neverUsesMap` in
  // routeConfiguration.js — then navigated client-side to this one). Lazily
  // load it on demand in that case; Google Maps is always loaded eagerly today
  // (see util/includeScripts.js), so it doesn't need this fallback.
  const [mapboxLibLoaded, setMapboxLibLoaded] = useState(mapboxMap.isMapsLibLoaded);
  useEffect(() => {
    if (isGoogleMapsInUse || mapboxLibLoaded || !hasApiAccessForMapProvider) {
      return undefined;
    }
    let cancelled = false;
    ensureMapboxLoaded({
      mapboxAccessToken: mapsConfiguration.mapboxAccessToken,
      rootURL: config.marketplaceRootURL,
    }).then(() => {
      if (!cancelled) {
        setMapboxLibLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    isGoogleMapsInUse,
    mapboxLibLoaded,
    hasApiAccessForMapProvider,
    mapsConfiguration.mapboxAccessToken,
    config.marketplaceRootURL,
  ]);
  const isMapsLibLoaded = isGoogleMapsInUse ? googleMapsMap.isMapsLibLoaded : () => mapboxLibLoaded;

  const classes = classNames(rootClassName || css.root, className);
  const mapClasses = mapRootClassName || css.mapRoot;

  if (mapsConfiguration.fuzzy.enabled && !obfuscatedCenter) {
    throw new Error(
      'Map: obfuscatedCenter prop is required when config.maps.fuzzy.enabled === true'
    );
  }
  if (!mapsConfiguration.fuzzy.enabled && !center) {
    throw new Error('Map: center prop is required when config.maps.fuzzy.enabled === false');
  }

  const location = mapsConfiguration.fuzzy.enabled ? obfuscatedCenter : center;
  const zoomLevel =
    zoom || mapsConfiguration.fuzzy.enabled ? mapsConfiguration.fuzzy.defaultZoomLevel : 11;

  const isMapProviderAvailable = hasApiAccessForMapProvider && isMapsLibLoaded();
  return !isMapProviderAvailable ? (
    <div className={classes} />
  ) : useStaticMap ? (
    <StaticMap
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
    />
  ) : (
    <DynamicMap
      containerClassName={classes}
      mapClassName={mapClasses}
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
    />
  );
};

export default Map;
