/**
 * @module botbuilder-lg-vscode
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as vscode from 'vscode';
import * as util from '../util';
import { LGTemplate, LGParser } from 'botbuilder-lg';
import * as path from 'path';

/**
 * Provide the user with possible corrective actions right next to an error or warning.
 * If actions are available, a light bulb appears next to the error or warning.
 * When the user clicks the light bulb, a list of available Code Actions is presented.
 * @see https://code.visualstudio.com/api/language-extensions/programmatic-language-features#possible-actions-on-errors-or-warnings
 * @export
 * @class LGCodeActionProvider
 * @implements [CodeActionProvider ](#vscode.CodeActionProvider )
 */

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', new LGCodeActionProvider()));
}

class LGCodeActionProvider implements vscode.CodeActionProvider  {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        let codeActions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            let templateName: string;
            if (diagnostic === undefined) {
                continue;
            } else if (diagnostic.message.endsWith('template not found')) {
                const templateNameResult: RegExpExecArray = /\[([^)]*)\]/.exec(diagnostic.message);
                if (templateNameResult === null || templateNameResult === undefined) {
                    continue;
                }

                templateName = templateNameResult[1];
            } else if (diagnostic.message.includes('no such template') && diagnostic.message.includes('lgTemplate')) {

                // error message: Parse failed for expression 'lgTemplate('Items-Ordinality')', inner error: Error: no such template 'Items-Ordinality' to call in lgTemplat
                var startindex: number = diagnostic.message.indexOf('lgTemplate') + 'lgTemplate('.length;
                var length: number = diagnostic.message.substr(startindex).indexOf(')');
                templateName = diagnostic.message.substr(startindex + 1, length - 2); // remove ''
            }

            if (templateName === undefined || templateName === '') {
                continue;
            }

            const allTemplates: LGTemplate[] = util.GetAllTemplateFromCurrentWorkspace(); // all tempaltes in the workspace
            const currentTemplates: LGTemplate[] = util.GetAllTemplatesFromCurrentLGFile(document.uri); // templates that this lg file have/import

            if (currentTemplates.find(u=>u.Name == templateName) !== undefined) {
                // has imported
                continue;
            }

            const template = allTemplates.find(u=>u.Name == templateName);
            if (template === undefined) {
                // not find this template in the whole workspace
                continue;
            }

            var relativePath = path.relative(path.dirname(document.uri.fsPath), template.Source);

            codeActions.push({
                title: `Import from ${relativePath}`,
                edit: this.getActionEditor(document, relativePath),
                diagnostics: [diagnostic],
                kind: vscode.CodeActionKind.QuickFix
            });
        }

        return codeActions;
    }

    private getActionEditor(document: vscode.TextDocument, relativePath: string): vscode.WorkspaceEdit {
        var editor: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        editor.insert(document.uri, new vscode.Position(0,0), `[import](${relativePath})\r\n`);
        return editor;
    }
}

