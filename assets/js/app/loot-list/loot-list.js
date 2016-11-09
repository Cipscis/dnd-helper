define(
	[
		'app/loot-list/item',
		'app/loot-list/list',
		'app/loot-list/enums',

		'templayed'
	],

	function (Item, List, Enums, templayed) {

		var init = function () {

			var testItem = new Item({
				name: 'Test Item',
				rarity: Enums.RARITY.COMMON,
				tags: ['Test', 'Test2'],
				modifiers: []
			});

			var testRareItem = new Item({
				name: 'Test Rare Item',
				rarity: Enums.RARITY.RARE,
				tags: ['Test'],
				modifiers: []
			});

			var testSpecialItem = new Item({
				name: 'Test Special Item',
				rarity: Enums.RARITY.COMMON,
				tags: ['Special'],
				modifiers: []
			});

			var testList = new List({
				items: [testItem, testRareItem, testSpecialItem],
				tagRarity: {
					Test: 1,
					Test2: 0.5
				}
			});



			var objectMaterials = new List({
				items: [
					new Item({
						name: 'Wood',
						rarity: 60
					}),
					new Item({
						name: 'Metal',
						rarity: 30
					}),
					new Item({
						name: 'Stone',
						rarity: 10
					})
				]
			});

			var clothesMaterials = new List({
				size: 100,
				items: [
					new Item({
						name: 'Wool',
						rarity: 33
					}),
					new Item({
						name: 'Leather',
						rarity: 33
					}),
					new Item({
						name: 'Cotton',
						rarity: 33
					})
				]
			});

			var $template = document.getElementById('loot-list-template');
			var $lootList = document.getElementById('loot-list');

			$lootList.innerHTML = templayed($template.innerHTML)(clothesMaterials);

		};

		return {
			init: init
		};

	}
);