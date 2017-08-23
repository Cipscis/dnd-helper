define(
	[
		'jquery'
	],

	function ($) {
		var defaults = {
			$el: $('body')
		};

		var IndexItem = function (options) {
			var prop,
				$fields, $field,
				i;

			for (prop in options) {
				if (options.hasOwnProperty(prop)) {
					this[prop] = options[prop];
				}
			}

			for (prop in defaults) {
				if (defaults.hasOwnProperty(prop)) {
					if (typeof this[prop] === 'undefined') {
						this[prop] = defaults[prop];
					}
				}
			}

			this.fields = this.fields || [];

			$fields = this.$el.find('.js-filter__field');

			for (i = 0; i < $fields.length; i++) {
				$field = $fields.eq(i);

				this.fields.push({
					text: $field.text(),
					power: $field.data('filter-field-power') || 1
				});
			}
		};

		IndexItem.prototype.getRelevance = function (query) {
			// Calculate relevance as the sum of the number of matches in
			// each field multiplied by that field's power

			var i,
				field,
				match,
				relevance = 0;

			for (i = 0; i < this.fields.length; i++) {
				field = this.fields[i];

				match = field.text.match(query);
				if (match) {
					relevance += match.length * field.power;
				}
			}

			return relevance;
		};

		return IndexItem;
	}
);