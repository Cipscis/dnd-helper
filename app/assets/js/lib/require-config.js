require.config({
	baseUrl: '/assets/js',
	paths: {
		'jquery': 'lib/jquery-3.1.1',
		'templayed': 'lib/templayed',
		'mustache': 'lib/mustache',

		'expand-collapse': 'app/expand-collapse/expand-collapse',
		'inventory': 'app/inventory/inventory',
		'combat': 'app/combat',
		'image': 'app/image',
		'sound': 'app/sound',
		'char-cards': 'app/char-cards/char-cards',
		'loot-list': 'app/loot-list/loot-list',
		'drag-sort': 'app/drag-sort/drag-sort',
		'stat-block': 'app/stat-block/stat-block',
		'binder': 'app/binder/binder',
		'filter': 'app/filter',
		'cartographer': 'app/cartographer',
		'encyclopedia': 'app/encyclopedia',
		'calendar': 'app/calendar',
		'text': 'lib/text',

		'youtube': 'https://www.youtube.com/iframe_api?' // Query string to prevent .js being added automatically
	},
	shim: {
		templayed: {
			exports: 'templayed'
		},
		youtube: {
			exports: 'YT'
		}
	}
});