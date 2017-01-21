define(
	[
		'jquery'
	],

	function ($) {

		// Allows data to be bound to DOM elements

		// Changes made to the values of input elements
		// within the bound element will trigger updates
		// to the bound data object.

		// Likewise, changes to the bound data object
		// will trigger updates to the bound elements
		// in the DOM.

		// Elements within the bound element can be
		// bound to properties by giving them the
		// name of the property using the
		// data-binder-value attribute.

		// Elements of type input, textarea, and select
		// can accept changes in the DOM. All other elements
		// will only reflect the state of the data object

		// Because a Proxy is used to detect changes to
		// the data object, the object return from the
		// bind() method must be used instead of the
		// original data object

		var Binder = {
			bind: function (data, $el) {
				var fn = Binder._changeInDOM.bind($el),
					proxy;

				data.$el = $el;
				proxy = new Proxy(data, {
					set: Binder._changeInData
				});

				$el.data('binder-data', proxy);
				$el.data('binder-fn', fn);
				$el.on('change input', 'input, textarea, select', fn);

				return proxy;
			},

			unbind: function ($el) {
				var fn = $el.data('binder-fn');

				$el.off('change input', 'input, textarea, select', fn);
				$el.data('binder-fn', undefined);
				$el.data('binder-data', undefined);
			},

			_changeInDOM: function (e) {
				// A change has been detected in a bound DOM element
				// Update the data element. This will trigger updates to the DOM

				var $input = $(e.target),
					name = $input.data('binder-value'),
					val = $input.val(),

					$el = this,
					data = $el.data('binder-data');

				data[name] = val;
			},

			_changeInData: function (obj, name, val) {
				// A change has been detected in the bound object
				// Update the DOM to reflect this change

				var $el = obj.$el;

				obj[name] = val;

				$el
					.find('[data-binder-value="' + name + '"]')
					.text(val).val(val);
			}
		};

		return Binder;

	}
);