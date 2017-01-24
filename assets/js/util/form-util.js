define(
	[
		'jquery'
	],

	function ($) {
		var getDataFromForm = function ($form) {
			// Helper function to get a data object instead of an array from serializeArray
			var formArray,
				formData;

			formArray = $form.serializeArray();
			formData = {};
			for (i = 0; i < formArray.length; i++) {
				var name = formArray[i].name,
					value = formArray[i].value;

				formData[name] = value;
			}

			return formData;
		};

		return {
			getDataFromForm: getDataFromForm
		};
	}
);