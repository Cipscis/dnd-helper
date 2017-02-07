define(
	[],

	function () {

		var IO,
			$link,
			$fileInput,
			fileLoadedCallback;

		IO = {
			saveJson: function (data, filename) {
				// Construct a JSON Blob and download it

				var blob, url;

				$link = $link || document.createElement('a');

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
			},

			loadFile: function (callback) {
				if (!$fileInput) {
					$fileInput = document.createElement('input');

					$fileInput.type = 'file';
					$fileInput.addEventListener('change', IO._loadFile);
				}

				fileLoadedCallback = callback;
				$fileInput.click();
			},

			_loadFile: function (e) {
				var callback = this,
					file = $fileInput.files[0],
					reader = new FileReader();

				// So if the same file is selected again, it will trigger the "change" event
				$fileInput.value = '';

				reader.onload = IO._fileLoaded;
				reader.readAsText(file);
			},

			_fileLoaded: function (e) {
				var callback = this,
					reader = e.target;

				if (reader.readyState === 2) {
					// DONE
					fileLoadedCallback(reader.result);
					fileLoadedCallback = undefined;
				}
			}
		};

		return IO;

	}
);