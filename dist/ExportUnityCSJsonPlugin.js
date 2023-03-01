"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportUJsonPlugin = exports.exportUJsonLoader = exports.exportUJson = void 0;
const export_table_lib_1 = require("export-table-lib");
const fs = __importStar(require("fs-extra"));
let firstLetterUpper = export_table_lib_1.makeFirstLetterUpper;
function exportUJson(paras) {
    let { datas, fields, name, objects, table, } = paras;
    let firstLetterLower = function (str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    };
    let convMemberName = function (str) {
        return str.split("_").map(s => firstLetterUpper(s)).join("");
    };
    var fullName = `${table.workbookName}-${name}`;
    let jsonString = JSON.stringify(objects.map(obj => {
        var newObj = Object.create(null);
        Object.keys(obj).forEach(key => {
            var newKey = convMemberName(key);
            newObj[newKey] = obj[key];
        });
        return newObj;
    }));
    return jsonString;
    // 	// !!!必须开头没有空格
    // 	let temp = `%YAML 1.1
    // %TAG !u! tag:unity3d.com,2011:
    // --- !u!114 &11400000
    // MonoBehaviour:
    //   m_ObjectHideFlags: 0
    //   m_CorrespondingSourceObject: {fileID: 0}
    //   m_PrefabInstance: {fileID: 0}
    //   m_PrefabAsset: {fileID: 0}
    //   m_GameObject: {fileID: 0}
    //   m_Enabled: 1
    //   m_EditorHideFlags: 0
    //   m_Script: {fileID: 11500000, guid: 496f60086c072a8479a6e0b948efb5e8, type: 3}
    //   m_Name: ${fullName}
    //   m_EditorClassIdentifier:
    //   JsonText: ${JSON.stringify(jsonString)}
    // `
    // 	return temp
}
exports.exportUJson = exportUJson;
function exportUJsonLoader(paras) {
    let { datas, fields, name, objects, table, } = paras;
    let RowClass = firstLetterUpper(name);
    var fullName = `${table.workbookName}-${name}`;
    // !!!必须开头没有空格
    let temp = `
using UnityEngine.AddressableAssets;
using System.Threading.Tasks;
using UnityEngine;
using lang.json;

namespace MEEC.ExportedConfigs
{
	public partial class ${RowClass}
	{
#if UNITY_EDITOR && ENABLE_CONFIG_LOG
		static ${RowClass}()
		{
			Debug.Log("ReferConfig-${RowClass}");
		}
#endif
		public static async Task Load()
		{
			var loadUrl="Assets/Bundles/GameConfigs/Auto/${fullName}.json";
			var configJson =
#if UNITY_EDITOR
				Application.isPlaying ? await Addressables.LoadAssetAsync<TextAsset>(loadUrl).Task
					: UnityEditor.AssetDatabase.LoadAssetAtPath<TextAsset>(loadUrl);
#else
				await Addressables.LoadAssetAsync<TextAsset>(loadUrl).Task;
#endif
			if (configJson != null)
			{
				var jsonObjs = JSON.parse<${RowClass}[]>(configJson.text);
				var configs = ${RowClass}.Configs;
				configs.Clear();
				configs.AddRange(jsonObjs);
			}
			else
			{
				Debug.LogError($"配表资源缺失: {loadUrl}");
			}
		}

#if UNITY_EDITOR
		public static void LoadInEditor()
		{
			if (Application.isPlaying)
			{
				var tip = $"cannot load ${RowClass}[] with LoadInEditor at runtime";
				Debug.LogError(tip);
				throw new System.Exception(tip);
			}
			var loadUrl="Assets/Bundles/GameConfigs/Auto/${fullName}.json";
			var configJson = UnityEditor.AssetDatabase.LoadAssetAtPath<TextAsset>(loadUrl);
			if (configJson != null)
			{
				var jsonObjs = JSON.parse<${RowClass}[]>(configJson.text);
				var configs = ${RowClass}.Configs;
				configs.Clear();
				configs.AddRange(jsonObjs);
			}
			else
			{
				Debug.LogError($"配表资源缺失: {loadUrl}");
			}
		}
#endif
	}
}
`;
    return temp;
}
exports.exportUJsonLoader = exportUJsonLoader;
class ExportUJsonPlugin extends export_table_lib_1.PluginBase {
    constructor() {
        super(...arguments);
        this.name = "ujson";
        this.tags = ["ujson"];
    }
    handleSheet(paras) {
        var fullName = `${paras.table.workbookName}-${paras.name}`;
        {
            let content1 = exportUJsonLoader(paras);
            if (content1 != null) {
                let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, "Loader.cs").fullPath;
                fs.outputFileSync(savePath, content1, "utf-8");
            }
        }
        {
            let content2 = exportUJson(paras);
            if (content2 != null) {
                let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, ".json").fullPath;
                fs.outputFileSync(savePath, content2, "utf-8");
            }
            return content2;
        }
    }
    handleBatch(paras) {
        var tables = paras.tables;
        var temp = `
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MEEC.ExportedConfigs
{
	public static class DefaultConfigLoader{
		public static IEnumerable<Func<Task>> Load(){
${export_table_lib_1.foreach(tables, (table) => `
			yield return ${firstLetterUpper(table.name)}.Load;
`)}
			yield break;
		}
	}
}
`;
        let savePath = paras.outPath + "/DefaultConfigLoader.cs";
        fs.outputFileSync(savePath, temp, "utf-8");
    }
}
exports.ExportUJsonPlugin = ExportUJsonPlugin;
