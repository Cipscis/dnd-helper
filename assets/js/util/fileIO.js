define(
	[],

	function () {

		var IO;

		IO = {
			saveJson: function (data, filename) {
				// Construct a JSON Blob and download it

				var blob, url,
					$link = document.createElement('a');

				blob = new Blob(
					[JSON.stringify(data)],
					{
						type: 'application/json'
					}
				);

				url = URL.createObjectURL(blob);

				$link.href = url;
				$link.download = filename + '.json';
				$link.click();

				URL.revokeObjectURL(url);
			}
		};

		return IO;

	}
);