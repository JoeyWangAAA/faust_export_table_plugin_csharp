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
exports.ExportPlugin = exports.export_stuff = void 0;
const export_table_lib_1 = require("export-table-lib");
const fs = __importStar(require("fs-extra"));
var isSkipExportDefaults = process.argv.findIndex(v => v == "--SkipDefaults") >= 0;
function export_stuff(paras) {
    let { datas, fields, inject, name, objects, packagename, tables, xxtea, } = paras;
    let firstLetterUpper = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    let firstLetterLower = function (str) {
        var str2 = filterKeyChar(str);
        return str2.charAt(0).toLowerCase() + str2.slice(1);
    };
    let convMemberName = function (str) {
        var str2 = filterKeyChar(str);
        //去除_
        var str3 = str2.split("_").map(s => firstLetterUpper(s)).join("");
        return str3;
    };
    let filterKeyChar = function (str) {
        //去除$
        var str1 = str.split("$").map(s => s).join("");
        //去除#
        var str2 = str1.split("#").map(s => s).join("");
        return str2;
    };
    let convGetMembetName = function (str) {
        var str2 = filterKeyChar(str);
        return "Get" + firstLetterUpper(str2);
    };
    let convVarName = firstLetterLower;
    let RowClass = firstLetterUpper(name);
    let initFunc = name + "Init";
    let mapfield = fields.find(a => a.type == "key"); //如果是map，则生成对应的map
    let mapName = name + "Map";
    let getFieldType = function (f) {
        let t = f.type;
        if (t == "object") {
            //throw new Error("invalid type <Dictionary<string,string>>")
            return "Dictionary<string,string>";
        }
        else if (t == "object[]") {
            //throw new Error("invalid type <Dictionary<string,string>[]>")
            return "List<Dictionary<string,string>>";
        }
        else if (t == "number") {
            return "double";
        }
        else if (t == "number[]") {
            return "double[]";
        }
        else if (t == "int") {
            return "int";
        }
        else if (t == "int[]") {
            return "int[]";
        }
        else if (t == "long") {
            return "long";
        }
        else if (t == "long[]") {
            return "long[]";
        }
        else if (t == "uid") {
            return "int";
        }
        else if (t == "bool") {
            return "bool";
        }
        else if (t == "bool[]") {
            return "bool[]";
        }
        else if (t == "string") {
            return "string";
        }
        else if (t == "string[]") {
            return "string[]";
        }
        else if (t == "fk") {
            return "int";
        }
        else if (t == "fk[]") {
            return "int[]";
        }
        else if (t == "any") {
            console.log(f);
            throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
        }
        else if (t == "key") {
            return "string";
        }
        else {
            throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
        }
        return t;
    };
    let getFkFieldType = function (field) {
        return tables.find(a => a.name == field.fkTableName).fields.find(a => a.name == field.fkFieldName).type;
    };
    const genTranslateValue = (value, f) => {
        //翻译文本
        if (f == "$") {
            value = "$" + value;
        }
        return JSON.stringify(value);
    };
    const genValue = (value, f) => {
        let t = f.type;
        if (t == "object") {
            //throw new Error("invalid type <object>")
            let convert = [];
            for (let k in value) {
                convert.push(`{"${k}","${value[k].toString()}"}`);
            }
            ;
            return `new Dictionary<string,string>(){${convert}}`;
        }
        else if (t == "object[]") {
            let values = value;
            //throw new Error("invalid type <object[]>")
            return `new List<Dictionary<string,string>>(){${values.map((val) => {
                let convert = [];
                for (let k in val) {
                    convert.push(`{"${k}","${val[k].toString()}"}`);
                }
                ;
                return `new Dictionary<string,string>(){${convert}}`;
            })}}`;
        }
        else if (t == "number" || t == "int" || t == "long") {
            return `${value}`;
        }
        else if (t == "number[]") {
            let values = value;
            return `new double[]{${values.join(", ")}}`;
        }
        else if (t == "int[]") {
            let values = value;
            return `new int[]{${values.join(", ")}}`;
        }
        else if (t == "long[]") {
            let values = value;
            return `new long[]{${values.join(", ")}}`;
        }
        else if (t == "uid") {
            return `${value}`;
        }
        else if (t == "bool") {
            return `${value}`;
        }
        else if (t == "bool[]") {
            let values = value;
            return `new bool[]{${values.join(", ")}}`;
        }
        else if (t == "string") {
            // return `"${value}"`
            return JSON.stringify(value);
        }
        else if (t == "string[]") {
            let values = value;
            return `new string[]{${values.map(v => JSON.stringify(v)).join(", ")}}`;
        }
        else if (t == "fk") {
            return `${value}`;
        }
        else if (t == "fk[]") {
            let values = value;
            return `new int[]{${values.join(", ")}}`;
        }
        else if (t == "any") {
            console.log(f);
            throw new Error(`invalid type ${f.name}:<${f.rawType} => any>`);
        }
        else if (t == "key") {
            return `${value}`;
        }
        throw new Error(`invalid type ${f.name}:<${f.rawType} => unkown>`);
    };
    const getTitle = (v) => {
        return v.describe.split("\n")[0];
    };
    const getDescripts = (v) => {
        return v.describe.split("\n");
    };
    let temp = `
using System.Collections.Generic;
using System.Linq;

namespace MEEC.ExportedConfigs{
public partial class ${RowClass} {

	public static List<${RowClass}> Configs = new List<${RowClass}>()
	{
${export_table_lib_1.foreach(datas, data => `		new ${RowClass}(${export_table_lib_1.st(() => fields.map((f, index) => {
        if (f.nameOrigin.indexOf("$") != -1) {
            return (genTranslateValue(data[index], "$"));
        }
        else if (f.nameOrigin.indexOf("#") != -1) {
            return (genTranslateValue(data[index], "#"));
        }
        else {
            return genValue(data[index], f);
        }
    }).join(", "))}),`)}
	};

	public ${RowClass}() { }
	public ${RowClass}(${export_table_lib_1.st(() => fields.map(f => `${getFieldType(f)} ${convVarName(f.name)}`).join(", "))})
	{
${export_table_lib_1.foreach(fields, f => `		this.${convMemberName(f.name)} = ${convVarName(f.name)};`)}
	}

	public virtual ${RowClass} MergeFrom(${RowClass} source)
	{
${export_table_lib_1.foreach(fields, f => `		this.${convMemberName(f.name)} = source.${convMemberName(f.name)};`)}
		return this;
	}

	public virtual ${RowClass} Clone()
	{
		var config = new ${RowClass}();
		config.MergeFrom(this);
		return config;
	}

	${export_table_lib_1.cmm( /**生成字段 */)}
${export_table_lib_1.foreach(fields, f => `
	/// <summary>
${export_table_lib_1.foreach(getDescripts(f), line => `	/// ${line}`)}
	/// </summary>
	public ${getFieldType(f)} ${convMemberName(f.name)};`)}

	${export_table_lib_1.cmm( /**生成get字段 */)}
#region get字段
${export_table_lib_1.foreach(fields, f => {
        if (f.nameOrigin != f.name) {
            return `	public ${getFieldType(f)} ${getTitle(f).replace(" ", "_")} => ${convMemberName(f.name)};`;
        }
        else {
            if (f.nameOrigin.indexOf("$") != -1) {
                return `    public string ${convGetMembetName(f.name)}
	{
		get
		{
			return Language.Get("${RowClass}_${convMemberName(f.name)}_" + this.${firstLetterUpper(fields[0].name)});
		}
	}`;
            }
            else if (f.nameOrigin.indexOf("#") != -1) {
                return `    public string ${convGetMembetName(f.name)}
	{
		get
		{
			return Language.Get(this.${convMemberName(f.name)});
		}
	}`;
            }
            else {
                return "";
            }
        }
    })}
#endregion

#region uid map
${export_table_lib_1.foreach(fields, f => {
        if (f.isUnique) {
            return `
		protected static Dictionary<${getFieldType(f)}, ${RowClass}> _tempDictBy${convMemberName(f.name)};
		public static ${RowClass} GetConfigBy${convMemberName(f.name)}(${getFieldType(f)} ${convMemberName(f.name)})
		{
			if (_tempDictBy${convMemberName(f.name)} == null)
			{
				_tempDictBy${convMemberName(f.name)} = new Dictionary<${getFieldType(f)}, ${RowClass}>();
				Configs.ForEach(c =>
				{
					_tempDictBy${convMemberName(f.name)}.Add(c.${convMemberName(f.name)}, c);
				});
			}
			return _tempDictBy${convMemberName(f.name)}.GetValueOrDefault(${convMemberName(f.name)});
		}
`;
        }
        else if (f.type == "number" || f.type == "string") {
            return `
		protected static Dictionary<${getFieldType(f)}, ${RowClass}[]> _tempRecordsDictBy${convMemberName(f.name)} = new Dictionary<${getFieldType(f)}, ${RowClass}[]>();
		public static ${RowClass}[] GetConfigsBy${convMemberName(f.name)}(${getFieldType(f)} ${convMemberName(f.name)})
		{
			if (_tempRecordsDictBy${convMemberName(f.name)}.ContainsKey(${convMemberName(f.name)}))
			{
				return _tempRecordsDictBy${convMemberName(f.name)}.GetValueOrDefault(${convMemberName(f.name)});
			}
			else
			{
				var records = Configs.Where(c => c.${convMemberName(f.name)} == ${convMemberName(f.name)}).ToArray();
				_tempRecordsDictBy${convMemberName(f.name)}.Add(${convMemberName(f.name)}, records);
				return records;
			}
		}
`;
        }
        else {
            return "";
        }
    })}

#endregion uid map

#region 生成fk.get/set
${export_table_lib_1.foreach(fields, f => `
${export_table_lib_1.iff(f.type == "fk", () => `
${export_table_lib_1.iff(getFkFieldType(f).toLowerCase() != "uid", () => `
	protected ${convMemberName(f.fkTableName)}[] _fk${convMemberName(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${convMemberName(f.fkTableName)}[] ${convMemberName(f.name)}DataList{
		get{
			if(this._fk${convMemberName(f.name)}==null){
				if(null==this.${convMemberName(f.name)}){
					this._fk${convMemberName(f.name)} = new ${convMemberName(f.fkTableName)}[0];
				}else{
					this._fk${convMemberName(f.name)}=${convMemberName(f.fkTableName)}.Configs.FindAll(a=>a.${convMemberName(f.fkFieldName)}!=null && this.${convMemberName(f.name)}==a.${convMemberName(f.fkFieldName)}).ToArray();
				}
			}
			return this._fk${convMemberName(f.name)};
		}
	}
`).else(() => `
	protected ${convMemberName(f.fkTableName)} _fk${convMemberName(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${convMemberName(f.fkTableName)} ${convMemberName(f.name)}Data{
		get{
			if(this._fk${convMemberName(f.name)}==null){
				this._fk${convMemberName(f.name)}=${convMemberName(f.fkTableName)}.Configs.Find(a=>a.${convMemberName(f.fkFieldName)}==this.${convMemberName(f.name)});
			}
			return this._fk${convMemberName(f.name)};
		}
	}
`)}
`)}
${export_table_lib_1.iff(f.type == "fk[]", () => `
	protected ${convMemberName(f.fkTableName)}[] _fk${convMemberName(f.name)}=null;
	/**
	 * ${f.describe}
	 **/
	public virtual ${convMemberName(f.fkTableName)}[] ${convMemberName(f.name)}DataList{
		get{
			if(this._fk${convMemberName(f.name)}==null){
				if(null==this.${convMemberName(f.name)}){
					this._fk${convMemberName(f.name)} = new ${convMemberName(f.fkTableName)}[0];
				}else{
					this._fk${convMemberName(f.name)}=MEEC.ExportedConfigs.${convMemberName(f.fkTableName)}.Configs.FindAll(a=>a.${convMemberName(f.fkFieldName)}!=null && this.${convMemberName(f.name)}!.Contains(a.${convMemberName(f.fkFieldName)})).ToArray();
				}
			}
			return this._fk${convMemberName(f.name)};
		}
	}
`)}
`)}
#endregion 生成fk.get/set
}
}
`;
    return temp;
}
exports.export_stuff = export_stuff;
class ExportPlugin extends export_table_lib_1.PluginBase {
    constructor() {
        super(...arguments);
        this.name = "csharp";
        this.tags = ["cs"];
    }
    handleSheet(paras) {
        let content = export_stuff(paras);
        if (content != null) {
            fs.outputFileSync(paras.outFilePath.fullPath, content, "utf-8");
        }
        return content;
    }
}
exports.ExportPlugin = ExportPlugin;
