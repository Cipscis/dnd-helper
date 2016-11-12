define(
	[
		'jquery'
	],

	function ($) {

		// Allows data to be bound to DOM elements

		// When an input element with the name of a property
		// is updated, all elements within the bound DOM
		// element with the appropriate name or data-binder-value
		// attribute will have their values updated

		// This does not initialise values, or respond to data changes.
		// It only responds to changes in input element values in the DOM

		var Binder = {
			bind: function (data, $el) {
				var fn = Binder._changeInDOM.bind($el);

				$el.data('binder-data', data);
				$el.data('binder-fn', fn);
				$el.on('change input', 'input, textarea, select', fn);
			},

			unbind: function ($el) {
				var fn = $el.data('binder-fn');

				$el.off('change input', 'input, textarea, select', fn);
				$el.data('binder-fn', undefined);
				$el.data('binder-data', undefined);
			},

			_changeInDOM: function (e) {
				// A change has been detected in a bound DOM element
				// Update the data element,
				// then make sure the changes are reflected in the DOM

				var $input = $(e.target),
					name = $input.attr('name'),
					val = $input.val(),

					$el = this,
					data = $el.data('binder-data');

				data[name] = val;
				$el
					.find('[data-binder-value="' + name + '"], [name="' + name + '"]').not($input)
					.text(val).val(val);
			}
		};

		return Binder;

	}
);