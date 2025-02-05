<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as monaco from 'monaco-editor';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import type { ValidationResponse, ApiInfo } from '$lib/types';

	let editorElement: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let model: monaco.editor.ITextModel;
	let response: ValidationResponse | null = null;
	let isLoading = false;

	let exampleYaml = `Ingresa el TPL`;

	function loadCode(code: string, language: string) {
		model = monaco.editor.createModel(code, language);
		editor.setModel(model);
	}

	onMount(async () => {
		self.MonacoEnvironment = {
			getWorker: function (_: any, label: string) {
				if (label === 'json') {
					return new jsonWorker();
				}
				return new editorWorker();
			}
		};

		editor = monaco.editor.create(editorElement, {
			value: exampleYaml,
			language: 'json',
			automaticLayout: true,
			theme: 'vs-dark',
			minimap: { enabled: true },
			fontSize: 14,
			lineNumbers: 'on',
			roundedSelection: false,
			scrollBeyondLastLine: false,
			formatOnPaste: true,
			formatOnType: true,
			tabSize: 2,
			detectIndentation: true,
			dimension: {
				width: 800,
				height: 400
			}
		});

		loadCode(exampleYaml, 'json');
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});

	async function handleSubmit(e: MouseEvent) {
		e.preventDefault();
		isLoading = true;

		try {
			const content = editor.getValue();
			const res = await fetch('/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content })
			});
			response = await res.json();

			if (response && response.error && editor) {
				const match = response.error.match(/line (\d+), column (\d+):/);
				if (match) {
					const lineNumber = parseInt(match[1]);
					const column = parseInt(match[2]);

					editor.revealLineInCenter(lineNumber);
					editor.setPosition({ lineNumber, column });
					editor.focus();

					editor.deltaDecorations(
						[],
						[
							{
								range: new monaco.Range(lineNumber, 1, lineNumber, 1),
								options: {
									isWholeLine: true,
									className: 'errorLine',
									glyphMarginClassName: 'errorGlyph'
								}
							}
						]
					);
				}
			} else if (response && response.api && editor) {
				const formattedApi = JSON.stringify(response.api, null, 2);
				editor.setValue(formattedApi);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			response = { message: 'Error', error: errorMessage };
		} finally {
			isLoading = false;
		}
	}

	function ErrorDisplay(error: string) {
		const match = error.match(/line (\d+), column (\d+):/);
		const lineNumber = match ? match[1] : null;
		const columnNumber = match ? match[2] : null;

		return `
            <div class="space-y-4">
                <div class="font-semibold text-red-800">Error de validación:</div>
                <div class="text-red-700">
                    ${
											lineNumber && columnNumber
												? `
                        <div class="mb-2">
                            <span class="cursor-pointer underline hover:text-red-900">
                                Error en Línea ${lineNumber}, Columna ${columnNumber}
                            </span>
                        </div>
                    `
												: ''
										}
                    <div class="font-mono bg-red-100 p-2 rounded text-sm whitespace-pre-wrap">
                        ${error}
                    </div>
                </div>
            </div>
        `;
	}

	function SuccessDisplay(api: ApiInfo) {
		return `
            <div class="space-y-2">
                <div class="font-semibold text-green-800">API válida</div>
                <div class="bg-green-100 p-4 rounded">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="font-medium text-green-900">Versión OpenAPI:</div>
                            <div class="text-green-800">${api.openapi}</div>
                        </div>
                        <div>
                            <div class="font-medium text-green-900">Título:</div>
                            <div class="text-green-800">${api.info.title}</div>
                        </div>
                        <div>
                            <div class="font-medium text-green-900">Versión API:</div>
                            <div class="text-green-800">${api.info.version}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
	}
</script>

<div class="flex flex-col items-center p-4 max-w-[90rem] mx-auto">
	<section class="w-full flex justify-between">
		<header class="container mx-auto p-4">
			<h1 class="text-2xl font-semibold">OpenAPI Validator</h1>
		</header>
		<section class="flex w-full mt-3 justify-end">
			<button
				type="submit"
				class="w-fit p-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 rounded"
				on:click={handleSubmit}
				disabled={isLoading}
			>
				{#if isLoading}
					<div class="flex items-center">
						<svg
							class="animate-spin -ml-1 mr-3 h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Validando...
					</div>
				{:else}
					Validar OpenAPI
				{/if}
			</button>
		</section>
	</section>
	<div class="w-full mb-4"></div>
	<div class="w-full rounded-lg overflow-hidden shadow-lg" style="height: 600px;">
		<div class="h-full w-full" bind:this={editorElement} />
	</div>

	{#if response}
		<div class="w-full mt-6">
			<div
				class={'rounded-lg p-6 ' +
					(response.error
						? 'bg-red-50 border border-red-200'
						: 'bg-green-50 border border-green-200')}
			>
				{@html response.error
					? ErrorDisplay(response.error)
					: response.api && SuccessDisplay(response.api)}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.monaco-editor) {
		height: 100% !important;
		width: 100% !important;
	}

	:global(.errorLine) {
		background-color: rgba(255, 0, 0, 0.2);
		width: 100%;
	}

	:global(.errorGlyph) {
		background-color: red;
		width: 5px !important;
		margin-left: 3px;
	}

	:global(.monaco-editor .cursor) {
		width: 2px !important;
	}
</style>
