require.config({
	baseUrl: '/assets/js',
	paths: {
		'jquery': 'lib/jquery-3.1.1',
		'templayed': 'lib/templayed',
		'mustache': 'lib/mustache',

		'expand-collapse': 'app/expand-collapse/expand-collapse',
		'inventory': 'app/inventory/inventory',
		'combat': 'app/combat',
		'char-cards': 'app/char-cards/char-cards',
		'loot-list': 'app/loot-list/loot-list',
		'drag-sort': 'app/drag-sort/drag-sort',
		'binder': 'app/binder/binder',
		'filter': 'app/filter'
	},
	shim: {
		templayed: {
			exports: 'templayed'
		}
	}
});