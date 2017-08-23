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

		// Elements within the bound element can have their
		// text or value bound to a property by setting the value
		// of the data-binder-value attribute to the
		// name of the property.

		// Attribute values can be bound to properties via an
		// attribute named data-binder-attribute-[attributeName]

		// Elements of type input, textarea, and select
		// can pass changes in the DOM through to the bound
		// data object. All other elements will only reflect
		// the state of the data object.

		// This code allows each DOM element to have only one
		// data object bound to it, though nested elements can
		// have different bindings and become independent of their
		// parents. Multiple DOM elements can be bound to the same
		// data element.

		// Because a Proxy is used to detect changes to
		// the data object, the object return from the
		// bind() method must be modified instead of the
		// original data object.

		var Binder = {
			bind: function (data, $el) {
				var fn = Binder._changeInDOM.bind($el),
					proxy;

				if ($el.data('binder-data')) {
					// A DOM element can only have a single data object bound to it
					Binder.unbind($el);
				}

				// Set or add this element
				data.$el = data.$el ? data.$el.add($el) : $el;

				proxy = new Proxy(data, {
					set: Binder._changeInData
				});

				$el.data('binder-data', proxy);
				$el.data('binder-fn', fn);
				$el.on('change input', 'input, textarea, select', fn);

				return proxy;
			},

			unbind: function ($el) {
				var fn = $el.data('binder-fn'),
					data = $el.data('binder-data');

				data.$el = data.$el.not($el);

				$el.off('change input', 'input, textarea, select', fn);
				$el.data('binder-fn', undefined);
				$el.data('binder-data', undefined);
			},

			_changeInDOM: function (e) {
				// A change has been detected in a bound DOM element
				// Update the data element. This will trigger updates to the DOM

				var $input = $(e.target),
					name = $input.attr('data-binder-value'),
					val = $input.val(),

					$el = this,
					data = $el.data('binder-data'),

					$closestBoundElement = Binder._getClosestBoundElement($input);

				// Allow nested bound elements to remain independent
				if ($closestBoundElement.is($el)) {
					data[name] = val;
				}
			},

			_changeInData: function (obj, name, val) {
				// A change has been detected in the bound object
				// Update the DOM to reflect this change

				obj[name] = val;

				Binder._updateBoundValues(obj, name, val);
				Binder._updateBoundAttributes(obj, name, val);

				return true;
			},

			_updateBoundValues: function (obj, name, val) {
				var $el = obj.$el,
					$boundVals;

				// Only the bound DOM element's children can have bound values
				$boundVals = $el.find('[data-binder-value="' + name + '"]');

				// Allow nested bound elements to remain independent
				$boundVals.each(function (i, el) {
					var $closestBoundElement = Binder._getClosestBoundElement($(el)),
						$activeElement = $(document.activeElement);

					if ($closestBoundElement.is($el)) {
						// Don't change current focus element if it's an input, so as not to interrupt input
						if (!($activeElement.is($(el)) && $activeElement.is(':input'))) {
							if (($(el).text() || $(el).val()) !== val) {
								$(el).text(val).val(val);
							}
						}
					}
				});
			},

			_updateBoundAttributes: function (obj, name, val) {
				var $el = obj.$el,
					$boundAttrs;

				// Only allow valid attribute names
				if (name.match(/^\w+$/)) {
					// Both the bound DOM element and its children can have bound attributes
					$boundAttrs = $el.find('[data-binder-attribute-' + name + ']').add($el.filter('[data-binder-attribute-' + name + ']'));

					// Allow nested bound elements to remain independent
					$boundAttrs.each(function (i, el) {
						var $closestBoundElement = Binder._getClosestBoundElement($(el));

						if ($closestBoundElement.is($el)) {
							if ($(el).attr('data-binder-attribute-' + name) !== val) {
								$(el).attr('data-binder-attribute-' + name, val);
							}
						}
					});
				}
			},

			_getClosestBoundElement: function ($el) {
				var $closestBoundElement = $el;

				while ($closestBoundElement.length && !$closestBoundElement.data('binder-data')) {
					$closestBoundElement = $closestBoundElement.parent();
				}

				return $closestBoundElement;
			}
		};

		return Binder;

	}
);