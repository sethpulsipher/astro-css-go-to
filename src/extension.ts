// // The module 'vscode' contains the VS Code extensibility API
// import * as vscode from 'vscode';

// interface CSSMatch {
// 	position: vscode.Position;
// 	selector: string;
// 	specificity: number; // Higher number = more specific
// }

// // This method is called when your extension is activated
// export function activate(context: vscode.ExtensionContext) {

// 	let disposable = vscode.commands.registerCommand('astro-css-go-to.goToDefinition', () => {
// 		const editor = vscode.window.activeTextEditor;
// 		if (!editor) {
// 			return;
// 		}

// 		const document = editor.document;
// 		const selection = editor.selection;

// 		// Get the word under cursor (supports class and id names with hyphens)
// 		const wordRange = document.getWordRangeAtPosition(selection.active, /[\w-]+/);
// 		if (!wordRange) {
// 			return;
// 		}

// 		const targetName = document.getText(wordRange);
// 		const fileText = document.getText();

// 		// Determine if we're looking for a class or ID based on context
// 		const { selectorType, contextInfo } = detectSelectorType(document, wordRange, targetName);

// 		if (!selectorType) {
// 			vscode.window.showInformationMessage(`Unable to determine if "${targetName}" is a class or ID.`);
// 			return;
// 		}

// 		// Find style tag content
// 		const styleRegion = findStyleRegion(fileText);
// 		if (!styleRegion) {
// 			vscode.window.showInformationMessage(`No <style> tag found in this Astro file.`);
// 			return;
// 		}

// 		// Find all matching CSS selectors
// 		const matches = findCSSMatches(styleRegion, targetName, selectorType, document);

// 		if (matches.length === 0) {
// 			const prefix = selectorType === 'class' ? '.' : '#';
// 			vscode.window.showInformationMessage(`CSS definition for "${prefix}${targetName}" not found in the <style> tag.`);
// 			return;
// 		}

// 		// Choose the best match (most specific)
// 		const bestMatch = chooseBestMatch(matches, contextInfo);

// 		// Navigate to the definition
// 		editor.selection = new vscode.Selection(bestMatch.position, bestMatch.position);
// 		editor.revealRange(
// 			new vscode.Range(bestMatch.position, bestMatch.position),
// 			vscode.TextEditorRevealType.InCenter
// 		);

// 		// Show info about what was found if multiple matches exist
// 		if (matches.length > 1) {
// 			vscode.window.showInformationMessage(`Found ${matches.length} matches. Navigated to: ${bestMatch.selector}`);
// 		}
// 	});

// 	context.subscriptions.push(disposable);
// }

// function detectSelectorType(document: vscode.TextDocument, wordRange: vscode.Range, targetName: string): { selectorType: 'class' | 'id' | null, contextInfo: any } {
// 	const line = document.lineAt(wordRange.start.line);
// 	const lineText = line.text;
// 	const wordStart = wordRange.start.character;

// 	// Check if we're in a class attribute: class="target-name"
// 	const classAttrRegex = /class\s*=\s*["'][^"']*\b/g;
// 	let match;
// 	while ((match = classAttrRegex.exec(lineText)) !== null) {
// 		const attrStart = match.index;
// 		const attrEnd = match.index + match[0].length;
// 		if (wordStart >= attrStart && wordStart <= attrEnd) {
// 			return {
// 				selectorType: 'class',
// 				contextInfo: {
// 					type: 'attribute',
// 					parentElement: extractParentElement(document, wordRange.start.line)
// 				}
// 			};
// 		}
// 	}

// 	// Check if we're in an id attribute: id="target-name"
// 	const idAttrRegex = /id\s*=\s*["'][^"']*\b/g;
// 	while ((match = idAttrRegex.exec(lineText)) !== null) {
// 		const attrStart = match.index;
// 		const attrEnd = match.index + match[0].length;
// 		if (wordStart >= attrStart && wordStart <= attrEnd) {
// 			return {
// 				selectorType: 'id',
// 				contextInfo: {
// 					type: 'attribute',
// 					parentElement: extractParentElement(document, wordRange.start.line)
// 				}
// 			};
// 		}
// 	}

// 	// Check if we're in CSS and the character before is . or #
// 	const charBefore = wordStart > 0 ? lineText[wordStart - 1] : '';
// 	if (charBefore === '.') {
// 		return { selectorType: 'class', contextInfo: { type: 'css' } };
// 	} else if (charBefore === '#') {
// 		return { selectorType: 'id', contextInfo: { type: 'css' } };
// 	}

// 	// Default to class if we can't determine (common case)
// 	return { selectorType: 'class', contextInfo: { type: 'unknown' } };
// }

// function extractParentElement(document: vscode.TextDocument, lineNumber: number): string | null {
// 	// Look backwards to find the opening tag
// 	for (let i = lineNumber; i >= 0; i--) {
// 		const line = document.lineAt(i).text;
// 		const tagMatch = line.match(/<(\w+)[^>]*>/);
// 		if (tagMatch) {
// 			return tagMatch[1]; // Return tag name
// 		}
// 	}
// 	return null;
// }

// function findStyleRegion(fileText: string): { content: string, startOffset: number } | null {
// 	const styleTagStart = fileText.indexOf('<style');
// 	const styleTagEnd = fileText.lastIndexOf('</style>');

// 	if (styleTagStart === -1 || styleTagEnd === -1) {
// 		return null;
// 	}

// 	// Find where the actual CSS content starts (after the opening <style> tag)
// 	const styleContentStart = fileText.indexOf('>', styleTagStart) + 1;
// 	const styleContent = fileText.substring(styleContentStart, styleTagEnd);

// 	return {
// 		content: styleContent,
// 		startOffset: styleContentStart
// 	};
// }

// function findCSSMatches(styleRegion: { content: string, startOffset: number }, targetName: string, selectorType: 'class' | 'id', document: vscode.TextDocument): CSSMatch[] {
// 	const matches: CSSMatch[] = [];
// 	const prefix = selectorType === 'class' ? '\\.' : '#';

// 	// More comprehensive regex that handles various CSS selector patterns
// 	const selectorRegex = new RegExp(`([^{}]*${prefix}${targetName}(?![\\w-])[^{}]*?)\\s*{`, 'g');

// 	let match;
// 	while ((match = selectorRegex.exec(styleRegion.content)) !== null) {
// 		const fullSelector = match[1].trim();
// 		const selectorStart = match.index + match[1].indexOf(prefix[1] + targetName); // Find the actual position of our selector

// 		const position = document.positionAt(styleRegion.startOffset + selectorStart + 1); // +1 to skip the . or #

// 		matches.push({
// 			position,
// 			selector: fullSelector,
// 			specificity: calculateSpecificity(fullSelector, targetName, selectorType)
// 		});
// 	}

// 	return matches;
// }

// function calculateSpecificity(selector: string, targetName: string, selectorType: 'class' | 'id'): number {
// 	let specificity = 0;

// 	// Count IDs (100 points each)
// 	const idCount = (selector.match(/#[\w-]+/g) || []).length;
// 	specificity += idCount * 100;

// 	// Count classes (10 points each)
// 	const classCount = (selector.match(/\.[\w-]+/g) || []).length;
// 	specificity += classCount * 10;

// 	// Count elements (1 point each)
// 	const elementCount = (selector.match(/\b[a-z]+\b/g) || []).length;
// 	specificity += elementCount;

// 	// Bonus points for exact matches vs descendant selectors
// 	const prefix = selectorType === 'class' ? '.' : '#';
// 	if (selector.trim() === `${prefix}${targetName}`) {
// 		specificity += 1000; // Exact match gets priority
// 	}

// 	return specificity;
// }

// function chooseBestMatch(matches: CSSMatch[], contextInfo: any): CSSMatch {
// 	if (matches.length === 1) {
// 		return matches[0];
// 	}

// 	// Sort by specificity (highest first)
// 	matches.sort((a, b) => b.specificity - a.specificity);

// 	// If we have context about the parent element, prefer selectors that include it
// 	if (contextInfo.parentElement) {
// 		const contextMatches = matches.filter(match =>
// 			match.selector.toLowerCase().includes(contextInfo.parentElement.toLowerCase())
// 		);
// 		if (contextMatches.length > 0) {
// 			return contextMatches[0];
// 		}
// 	}

// 	return matches[0];
// }

// export function deactivate() { }

// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

interface CSSMatch {
	position: vscode.Position;
	selector: string;
	specificity: number; // Higher number = more specific
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('astro-css-go-to.goToDefinition', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const document = editor.document;
		const selection = editor.selection;

		// Get the word under cursor (supports class and id names with hyphens)
		const wordRange = document.getWordRangeAtPosition(selection.active, /[\w-]+/);
		if (!wordRange) {
			return;
		}

		const targetName = document.getText(wordRange);
		const fileText = document.getText();

		// Determine if we're looking for a class or ID based on context
		const { selectorType, contextInfo } = detectSelectorType(document, wordRange, targetName);

		if (!selectorType) {
			vscode.window.showInformationMessage(`Unable to determine if "${targetName}" is a class or ID.`);
			return;
		}

		// Find style tag content
		const styleRegion = findStyleRegion(fileText);
		if (!styleRegion) {
			vscode.window.showInformationMessage(`No <style> tag found in this Astro file.`);
			return;
		}

		// Find all matching CSS selectors
		const matches = findCSSMatches(styleRegion, targetName, selectorType, document);

		if (matches.length === 0) {
			const prefix = selectorType === 'class' ? '.' : '#';
			vscode.window.showInformationMessage(`CSS definition for "${prefix}${targetName}" not found in the <style> tag.`);
			return;
		}

		// Choose the best match (most specific)
		const bestMatch = chooseBestMatch(matches, contextInfo);

		// Get the desired action from configuration
		const definitionAction = vscode.workspace.getConfiguration('astro-css-go-to').get('definitionAction');

		if (definitionAction === 'peek') {
			// Show the definition in a peek window
			const targetUri = editor.document.uri;
			const targetRange = new vscode.Range(bestMatch.position, bestMatch.position);

			vscode.commands.executeCommand('editor.action.peekLocations', targetUri, selection.active, [new vscode.Location(targetUri, targetRange)], 'peek');

		} else {
			// Navigate to the definition
			editor.selection = new vscode.Selection(bestMatch.position, bestMatch.position);
			editor.revealRange(
				new vscode.Range(bestMatch.position, bestMatch.position),
				vscode.TextEditorRevealType.InCenter
			);
		}


		// Show info about what was found if multiple matches exist
		if (matches.length > 1) {
			vscode.window.showInformationMessage(`Found ${matches.length} matches. Navigated to: ${bestMatch.selector}`);
		}
	});

	context.subscriptions.push(disposable);
}

function detectSelectorType(document: vscode.TextDocument, wordRange: vscode.Range, targetName: string): { selectorType: 'class' | 'id' | null, contextInfo: any } {
	const line = document.lineAt(wordRange.start.line);
	const lineText = line.text;
	const wordStart = wordRange.start.character;

	// Check if we're in a class attribute: class="target-name"
	const classAttrRegex = /class\s*=\s*["'][^"']*\b/g;
	let match;
	while ((match = classAttrRegex.exec(lineText)) !== null) {
		const attrStart = match.index;
		const attrEnd = match.index + match[0].length;
		if (wordStart >= attrStart && wordStart <= attrEnd) {
			return {
				selectorType: 'class',
				contextInfo: {
					type: 'attribute',
					parentElement: extractParentElement(document, wordRange.start.line)
				}
			};
		}
	}

	// Check if we're in an id attribute: id="target-name"
	const idAttrRegex = /id\s*=\s*["'][^"']*\b/g;
	while ((match = idAttrRegex.exec(lineText)) !== null) {
		const attrStart = match.index;
		const attrEnd = match.index + match[0].length;
		if (wordStart >= attrStart && wordStart <= attrEnd) {
			return {
				selectorType: 'id',
				contextInfo: {
					type: 'attribute',
					parentElement: extractParentElement(document, wordRange.start.line)
				}
			};
		}
	}

	// Check if we're in CSS and the character before is . or #
	const charBefore = wordStart > 0 ? lineText[wordStart - 1] : '';
	if (charBefore === '.') {
		return { selectorType: 'class', contextInfo: { type: 'css' } };
	} else if (charBefore === '#') {
		return { selectorType: 'id', contextInfo: { type: 'css' } };
	}

	// Default to class if we can't determine (common case)
	return { selectorType: 'class', contextInfo: { type: 'unknown' } };
}

function extractParentElement(document: vscode.TextDocument, lineNumber: number): string | null {
	// Look backwards to find the opening tag
	for (let i = lineNumber; i >= 0; i--) {
		const line = document.lineAt(i).text;
		const tagMatch = line.match(/<(\w+)[^>]*>/);
		if (tagMatch) {
			return tagMatch[1]; // Return tag name
		}
	}
	return null;
}

function findStyleRegion(fileText: string): { content: string, startOffset: number } | null {
	const styleTagStart = fileText.indexOf('<style');
	const styleTagEnd = fileText.lastIndexOf('</style>');

	if (styleTagStart === -1 || styleTagEnd === -1) {
		return null;
	}

	// Find where the actual CSS content starts (after the opening <style> tag)
	const styleContentStart = fileText.indexOf('>', styleTagStart) + 1;
	const styleContent = fileText.substring(styleContentStart, styleTagEnd);

	return {
		content: styleContent,
		startOffset: styleContentStart
	};
}

function findCSSMatches(styleRegion: { content: string, startOffset: number }, targetName: string, selectorType: 'class' | 'id', document: vscode.TextDocument): CSSMatch[] {
	const matches: CSSMatch[] = [];
	const prefix = selectorType === 'class' ? '\\.' : '#';

	// More comprehensive regex that handles various CSS selector patterns
	const selectorRegex = new RegExp(`([^{}]*${prefix}${targetName}(?![\\w-])[^{}]*?)\\s*{`, 'g');

	let match;
	while ((match = selectorRegex.exec(styleRegion.content)) !== null) {
		const fullSelector = match[1].trim();
		const selectorStart = match.index + match[1].indexOf(prefix[1] + targetName); // Find the actual position of our selector

		const position = document.positionAt(styleRegion.startOffset + selectorStart + 1); // +1 to skip the . or #

		matches.push({
			position,
			selector: fullSelector,
			specificity: calculateSpecificity(fullSelector, targetName, selectorType)
		});
	}

	return matches;
}

function calculateSpecificity(selector: string, targetName: string, selectorType: 'class' | 'id'): number {
	let specificity = 0;

	// Count IDs (100 points each)
	const idCount = (selector.match(/#[\w-]+/g) || []).length;
	specificity += idCount * 100;

	// Count classes (10 points each)
	const classCount = (selector.match(/\.[\w-]+/g) || []).length;
	specificity += classCount * 10;

	// Count elements (1 point each)
	const elementCount = (selector.match(/\b[a-z]+\b/g) || []).length;
	specificity += elementCount;

	// Bonus points for exact matches vs descendant selectors
	const prefix = selectorType === 'class' ? '.' : '#';
	if (selector.trim() === `${prefix}${targetName}`) {
		specificity += 1000; // Exact match gets priority
	}

	return specificity;
}

function chooseBestMatch(matches: CSSMatch[], contextInfo: any): CSSMatch {
	if (matches.length === 1) {
		return matches[0];
	}

	// Sort by specificity (highest first)
	matches.sort((a, b) => b.specificity - a.specificity);

	// If we have context about the parent element, prefer selectors that include it
	if (contextInfo.parentElement) {
		const contextMatches = matches.filter(match =>
			match.selector.toLowerCase().includes(contextInfo.parentElement.toLowerCase())
		);
		if (contextMatches.length > 0) {
			return contextMatches[0];
		}
	}

	return matches[0];
}

export function deactivate() { }