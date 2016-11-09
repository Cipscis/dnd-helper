define(
	[
		'jquery',
		'mustache',

		'util/fileIO',

		'app/inventory/inventory-item'
	],

	// TODO:
	// - Containers, with capacity and contents
	// - Autocomplete from item library when adding new items
	// - Different types of items (e.g. coin, weapon,
	//   container, ammunition) with different displays

	function ($, Mustache, fileIO, InventoryItem) {

		var emptyInventory = {
			coins: [
				{
					type: 'platinum',
					quantity: 0
				},
				{
					type: 'gold',
					quantity: 0
				},
				{
					type: 'silver',
					quantity: 0
				},
				{
					type: 'copper',
					quantity: 0
				}
			],
			items: []
		};

		var orderObserver;

		var Inventory = {
			init: function () {
				Inventory._initEvents();
				Inventory._initOrderObserver();

				Inventory._renderFromData(emptyInventory);
				// Inventory._loadData('test');
			},

			_initEvents: function () {
				$(document)
					.on('submit', '.js-inventory-load', Inventory._loadSubmit)
					.on('change', '.js-coin', Inventory._coinChange)
					.on('submit', '.js-inventory-add', Inventory._addSubmit)
					.on('click', '.js-inventory-remove', Inventory._removeClick)
					.on('click', '.js-inventory-save', Inventory._saveClick);
			},

			_initOrderObserver: function () {
				// Each time a node is moved, it is removed then added
				// This orderObserver watches for these mutations, so
				// it can remove items from the list when their node is
				// removed, then add them back at the appropriate location
				// when their node is added back again.

				orderObserver = new MutationObserver(Inventory._observeOrderMutation);
			},

			_loadData: function (filename) {
				url = '/assets/json/inventory/' + filename + '.json';

				$.ajax({
					url: url,
					dataType: 'JSON',
					complete: Inventory._dataLoaded
				});
			},

			_dataLoaded: function (data, statusCode) {
				var i;

				if (data && data.responseJSON && statusCode === 'success') {
					$('.js-inventory-load-error').text('').hide();

					// Initialise all items as InventoryItems
					for (i = 0; i < data.responseJSON.items.length; i++) {
						data.responseJSON.items[i] = new InventoryItem(data.responseJSON.items[i]);
					}

					Inventory._renderFromData(data.responseJSON);
				} else {
					$('.js-inventory-load-error').text(data.statusText).show();
				}
			},

			_renderFromData: function (data) {
				var $template = $('.js-inventory-template'),
					$itemTemplate = $('.js-inventory-item-template'),
					$inventory = $('.js-inventory'),

					templateOutput = Mustache.render(
						$template.html(),
						data,
						{
							itemTemplate: $itemTemplate.html()
						}
					);

				// Stop watching with the orderObserver to freeze
				// inventory data as we manipulate the DOM
				orderObserver.disconnect();

				$inventory.data('inventory', data);
				$inventory.html(templateOutput);
				$inventory.find('.js-inventory-item').each(Inventory._bindInventoryItemToData);

				// (Re-)initialise watching with the orderObserver so
				// future changes to the DOM are automatically synced
				orderObserver.observe($('.js-inventory')[0], {
					childList: true,
					subtree: true
				});
			},

			_bindInventoryItemToData: function (i) {
				var data = Inventory._getData(),
					$item = $(this);

				Inventory._initInventoryItem($item, data.items[i]);
			},

			_initInventoryItem: function ($item, item) {
				$item.data('inventory-item', item);
				$item.on('change input', 'input, textarea, select', Inventory._itemInfoChange);
			},

			_itemInfoChange: function (e) {
				var $input = $(e.target),
					name = $input.attr('name'),
					val = $input.val(),

					$item = $input.closest('.js-inventory-item'),
					inventoryItem = $item.data('inventory-item');

				inventoryItem[name] = val;
				$item
					.find('[data-inventory-item-value="' + name + '"], [name="' + name + '"]').not($input)
					.text(val).val(val);
			},

			_loadSubmit: function (e) {
				e.preventDefault();

				// TODO: Allow use of file selector

				var $form = $(e.target).closest('.js-inventory-load'),
					data = $form.serializeArray(),
					i, filename;

				for (i = 0; i < data.length; i++) {
					if (data[i].name === 'filename') {
						filename = data[i].value;
					}
				}

				Inventory._loadData(filename);
			},

			_coinChange: function (e) {
				var $input = $(e.target),
					value = $input.val(),
					type = $input.data('inventory-coin-type'),

					i,
					inventory = Inventory._getData();

				for (i = 0; i < inventory.coins.length; i++) {
					if (inventory.coins[i].type === type) {
						inventory.coins[i].quantity = value;
					}
				}
			},

			_addSubmit: function (e) {
				e.preventDefault();

				var $form = $(e.target).closest('.js-inventory-add'),
					data = $form.serializeArray(),
					i, name;

				for (i = 0; i < data.length; i++) {
					if (data[i].name === 'name') {
						name = data[i].value;
					}
				}

				if (name) {
					Inventory._add(name);
				}
			},
			_add: function (name) {
				// Create new InventoryItem,
				// bind it to a new DOM element,
				// then insert that DOM element.
				// The orderObserver will add it to the list automatically.

				var options = {
						name: name
					},
					item = new InventoryItem(options),

					$itemTemplate = $('.js-inventory-item-template'),
					$item = $(Mustache.render($itemTemplate.html(), item)),

					$list = $('.js-inventory-items');

				$list.append($item);
				Inventory._initInventoryItem($item, item);
			},

			_removeClick: function (e) {
				e.preventDefault();

				var $item = $(e.target).closest('.js-inventory-item');
				Inventory._remove($item);
			},
			_remove: function ($item) {
				// Remove an item's DOM element.
				// The orderObserver will remove it from the list automatically.

				$item.remove();
			},

			_saveClick: function (e) {
				e.preventDefault();
				Inventory._save();
			},
			_save: function () {
				var $inventory = $('.js-inventory'),
					data = Inventory._getData();

				Inventory._saveData(data);
			},

			_getData: function () {
				return $('.js-inventory').data('inventory');
			},

			_saveData: function (data) {
				fileIO.saveJson(data, 'test inventory');
			},

			_observeOrderMutation: function (mutations) {
				var i, mutation;

				for (i = 0; i < mutations.length; i++) {
					mutation = mutations[i];

					mutation.removedNodes.forEach(Inventory._observeNodeRemoved);
					mutation.addedNodes.forEach(Inventory._observeNodeAdded);
				}
			},

			_observeNodeRemoved: function (removedNode) {
				var $node,
					$item, item,

					inventory, items,
					index;

				$node = $(removedNode);
				$item = $node.filter('.js-inventory-item') || $node.find('.js-inventory-item');

				if ($item.length) {
					item = $item.data('inventory-item');

					inventory = Inventory._getData();
					items = inventory.items;

					index = items.indexOf(item);

					// Remove item from list
					items.splice(index, 1);
				}
			},

			_observeNodeAdded: function (addedNode) {
				var $node,
					$item, item,

					$list, $items,
					inventory, items,
					index;

				$node = $(addedNode);
				$item = $node.filter('.js-inventory-item') || $node.find('.js-inventory-item');

				if ($item.length) {
					item = $item.data('inventory-item');

					$list = $item.closest('.js-inventory');
					$items = $list.find('.js-inventory-item');
					inventory = Inventory._getData();
					items = inventory.items;

					index = $items.index($item);

					// Add item to list at appropriate index
					items.splice(index, 0, item);
				}
			}
		};

		return Inventory;

	}
);