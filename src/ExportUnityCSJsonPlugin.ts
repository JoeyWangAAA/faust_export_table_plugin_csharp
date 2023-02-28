
import { cmm, HandleSheetParams, Field, foreach, IPlugin, st, PluginBase, HandleBatchParams, OutFilePath } from "export-table-lib"
import * as fs from "fs-extra"

export function exportUJson(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
	} = paras;

	let firstLetterUpper = function (str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};
	let firstLetterLower = function (str: string) {
		return str.charAt(0).toLowerCase() + str.slice(1);
	};
	let convMemberName = function (str: string) {
		return str.split("_").map(s => firstLetterUpper(s)).join("")
	}

	var fullName = `${table.workbookName}-${name}`
	let jsonString = JSON.stringify(objects.map(obj => {
		var newObj = Object.create(null);
		Object.keys(obj).forEach(key => {
			var newKey = convMemberName(key);
			newObj[newKey] = obj[key];
		})
		return newObj
	}));

	// !!!必须开头没有空格
	let temp = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 496f60086c072a8479a6e0b948efb5e8, type: 3}
  m_Name: ${fullName}
  m_EditorClassIdentifier: 
  JsonText: ${JSON.stringify(jsonString)}
`
	return temp

}

export function exportUJsonLoader(paras: HandleSheetParams): string | null {
	let {
		datas,
		fields,
		name,
		objects,
		table,
	} = paras;

	var fullName = `${table.workbookName}-${name}`
	// !!!必须开头没有空格
	let temp = `
using lang.json;
using UnityEngine.AddressableAssets;

namespace MEEC.ExportedConfigs
{
    public partial class ${name}
    {
        static ${name}()
        {
			var loadUrl="Assets/Bundles/GameConfigs/Auto/${fullName}.asset";
            var configJson = Addressables.LoadAssetAsync<ExcelConfigJson>(loadUrl).WaitForCompletion();
			if (configJson != null)
            {
				var jsonObjs = JSON.parse<${name}[]>(configJson.JsonText);
				var configs = ${name}.Configs;
				configs.Clear();
				configs.AddRange(jsonObjs);
			}
            else
            {
                Debug.LogError($"配表资源缺失: {loadUrl}");
            }
        }
    }
}
`
	return temp

}

export class ExportUJsonPlugin extends PluginBase {
	name = "ujson"
	tags: string[] = ["ujson"]

	handleSheet(paras: HandleSheetParams) {
		var fullName = `${paras.table.workbookName}-${paras.name}`
		{
			let content1 = exportUJsonLoader(paras)
			if (content1 != null) {
				let savePath = new OutFilePath(paras.outPath, fullName, "Loader.cs").fullPath
				fs.outputFileSync(savePath, content1, "utf-8")
			}
		}
		{
			let content2 = exportUJson(paras)
			if (content2 != null) {
				let savePath = new OutFilePath(paras.outPath, fullName, ".asset").fullPath
				fs.outputFileSync(savePath, content2, "utf-8")
			}
			return content2
		}
	}
}
