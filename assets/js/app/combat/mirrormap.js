define(
	[
		'combat/combatant',
		'combat/battlefield'
	],

	function (
		Combatant,
		Battlefield
	) {

		var mapData,
			combatants,
			battlefield;

		var MirrorMap = {
			init: function () {
				MirrorMap._initEvents();

				MirrorMap._getMapData();

				MirrorMap._initBattlefield();
				MirrorMap._updateCombatants();

				MirrorMap._initRendering();
			},

			_initEvents: function () {
				window.addEventListener('storage', MirrorMap._storageEvent);

				$(document).on('click', '.js-map-up', MirrorMap._mapUpEvent);
				$(document).on('click', '.js-map-down', MirrorMap._mapDownEvent);
				$(document).on('click', '.js-map-left', MirrorMap._mapLeftEvent);
				$(document).on('click', '.js-map-right', MirrorMap._mapRightEvent);
				$(document).on('click', '.js-map-centre', MirrorMap._mapResetEvent);
				$(document).on('click', '.js-map-zoom-in', MirrorMap._mapZoomInEvent);
				$(document).on('click', '.js-map-zoom-out', MirrorMap._mapZoomOutEvent);
			},

			_getMapData: function () {
				mapData = JSON.parse(localStorage.getItem('mirrormap'));
			},

			_updateMapData: function () {
				battlefield.tileSize = mapData.battlefield.tileSize;
				battlefield.image.src = mapData.battlefield.image;

				MirrorMap._updateCombatants();
			},

			_initBattlefield: function () {
				battlefield = new Battlefield({
					canvas: $('.js-mirrormap__canvas')[0],
					tileSize: mapData.battlefield.tileSize,
					image: mapData.battlefield.image
				});
			},

			_updateCombatants: function () {
				var i, combatant;

				combatants = [];

				for (i = 0; i < mapData.combatants.length; i++) {
					combatant = mapData.combatants[i];

					combatants.push(new Combatant(combatant));
				}
			},

			_storageEvent: function (e) {
				MirrorMap._getMapData();
				MirrorMap._updateMapData();
			},

			_initRendering: function () {
				MirrorMap._startDrawing(MirrorMap._drawFrame, 100, 50000);
			},

			_startDrawing: function (callback, maxDt, inactiveTimeout) {
				var time = 0;

				var doCallback = function (timestamp) {
					var dt = time ? (timestamp - time)/1000 : 0;

					time = timestamp;

					if (inactiveTimeout && dt > inactiveTimeout) {
						dt = 0;
					} else if (maxDt && dt > maxDt) {
						dt = maxDt;
					}

					callback(dt);

					requestAnimationFrame(doCallback);
				};

				requestAnimationFrame(doCallback);
			},

			_drawFrame: function (dt) {
				var i, combatant;

				battlefield.clear();

				battlefield.transform();

				battlefield.drawField(dt);
				MirrorMap._drawCombatants(dt);

				battlefield.resetTransform();
			},

			_drawCombatants: function (dt) {
				for (i = 0; i < combatants.length; i++) {
					combatant = combatants[i];

					combatant.draw(battlefield.context, dt, battlefield.tileSize);
				}
			},

			_mapUpEvent: function (e) {
				e.preventDefault();
				battlefield.pan(0, +battlefield.tileSize);
			},

			_mapDownEvent: function (e) {
				e.preventDefault();
				battlefield.pan(0, -battlefield.tileSize);
			},

			_mapLeftEvent: function (e) {
				e.preventDefault();
				battlefield.pan(+battlefield.tileSize, 0);
			},

			_mapRightEvent: function (e) {
				e.preventDefault();
				battlefield.pan(-battlefield.tileSize, 0);
			},

			_mapResetEvent: function (e) {
				e.preventDefault();
				battlefield.panTo(0, 0);
				battlefield.zoomTo(1);
			},

			_mapZoomInEvent: function (e) {
				e.preventDefault();
				battlefield.zoom(2);
			},

			_mapZoomOutEvent: function (e) {
				e.preventDefault();
				battlefield.zoom(0.5);
			}
		};

		return MirrorMap;

	}
);