"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportUJsonPlugin = exports.exportUJsonLoader = exports.exportUJson = void 0;
const export_table_lib_1 = require("export-table-lib");
const fs = __importStar(require("fs-extra"));
function exportUJson(paras) {
    let { datas, fields, name, objects, table, } = paras;
    let firstLetterUpper = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
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
`;
    return temp;
}
exports.exportUJson = exportUJson;
function exportUJsonLoader(paras) {
    let { datas, fields, name, objects, table, } = paras;
    var fullName = `${table.workbookName}-${name}`;
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
                let savePath = new export_table_lib_1.OutFilePath(paras.outPath, fullName, ".asset").fullPath;
                fs.outputFileSync(savePath, content2, "utf-8");
            }
            return content2;
        }
    }
}
exports.ExportUJsonPlugin = ExportUJsonPlugin;
