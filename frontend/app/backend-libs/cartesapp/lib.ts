/* eslint-disable */
/**
 * This file was automatically generated by cartesapp.template_generator.
 * DO NOT MODIFY IT BY HAND. Instead, run the generator,
 */
import { Signer, ethers, ContractReceipt } from "ethers";
import Ajv, { ValidateFunction } from "ajv"
import addFormats from "ajv-formats"

import { 
    advanceInput, inspect, 
    AdvanceOutput, InspectOptions, AdvanceInputOptions,
    Report as CartesiReport, Notice as CartesiNotice, Voucher as CartesiVoucher, 
    Maybe, Proof, validateNoticeFromParams, wasVoucherExecutedFromParams, executeVoucherFromParams, 
    queryNotice, queryReport, queryVoucher, GraphqlOptions
} from "cartesi-client";

import * as ifaces from "./ifaces";



/**
 * Configs
 */

const ajv = new Ajv();
addFormats(ajv);
ajv.addFormat("biginteger", (data) => {
    const dataTovalidate = data.startsWith('-') ? data.substring(1) : data;
    return ethers.utils.isHexString(dataTovalidate) && dataTovalidate.length % 2 == 0;
});
const abiCoder = new ethers.utils.AbiCoder();
export const CONVENTIONAL_TYPES: Array<string> = ["bytes","hex","str","int","dict","list","tuple","json"];
const MAX_SPLITTABLE_OUTPUT_SIZE = 4194247;


/**
 * Models
 */

export enum IOType {
    report,
    notice,
    voucher,
    mutationPayload,
    queryPayload
}

interface ModelInterface<T> {
    ioType: IOType;
    abiTypes: Array<string>;
    params: Array<string>;
    decoder?(data: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): T;
    exporter?(data: T): string;
    validator: ValidateFunction<T>;
}

export interface Models {
    [key: string]: ModelInterface<any>;
}

export interface InspectReportInput {
    index?: number;
}

export interface InspectReport {
    payload: string;
    input?: InspectReportInput;
    index?: number;
}

export interface OutputGetters {
    [key: string]: (o?: GraphqlOptions) => Promise<CartesiReport>|Promise<CartesiNotice>|Promise<CartesiVoucher>;
}

export const outputGetters: OutputGetters = {
    report: queryReport,
    notice: queryNotice,
    voucher: queryVoucher
}

export interface MutationOptions extends AdvanceInputOptions {
    decode?: boolean;
}

export interface QueryOptions extends InspectOptions {
    decode?: boolean;
    decodeModel?: string;
}

export class IOData<T extends object> {
    [key: string]: any;
    _model: ModelInterface<T>

    constructor(model: ModelInterface<T>, data: T, validate: boolean = true) {
        this._model = model;
        for (const key of this._model.params) {
            this[key] = (data as any)[key];
        }
        if (validate) this.validate();
    }

    get = (): T => {
        const data: any = {};
        for (const key of this._model.params) {
            data[key] = this[key];
        }
        return data;
    }

    validate = (): boolean => {
        const dataToValidate: any = { ...this.get() };
        for (const k of Object.keys(dataToValidate)) {
            if (ethers.BigNumber.isBigNumber(dataToValidate[k]))
                dataToValidate[k] = dataToValidate[k].toHexString();
        }
        if (!this._model.validator(dataToValidate))
            throw new Error(`Data does not implement interface: ${ajv.errorsText(this._model.validator.errors)}`);     
        return true;
    }

    export(): string {
        let payload: string;
        switch(this._model.ioType) {
            case IOType.mutationPayload: {
                // parametrize input to url
                const inputData: any = this.get();
                const paramList = Array<any>();
                for (const key of this._model.params) {
                    paramList.push(inputData[key]);
                }
                payload = abiCoder.encode(this._model.abiTypes,paramList);
                break;
            }
            case IOType.queryPayload: {
                // parametrize input to url
                const inputData: T = this.get();
                const paramList = Array<string>();
                for (const key in inputData) {
                    if (inputData[key] == undefined) continue;
                    if (Array.isArray(inputData[key])) {
                        for (const element in inputData[key]) {
                            paramList.push(`${key}=${inputData[key][element]}`);
                        }
                    } else {
                        paramList.push(`${key}=${inputData[key]}`);
                    }
                }
                payload = paramList.length > 0 ? `?${paramList.join('&')}` : "";
                break;
            }
            default: {
                throw new Error(`Invalid payload type ${this._model.ioType}`);
                // break;
            }
        }
        return payload;
    }
}

export class BasicOutput<T extends object> extends IOData<T> {
    _payload: string
    _inputIndex?: number
    _outputIndex?: number

    constructor(model: ModelInterface<T>, payload: string, inputIndex?: number, outputIndex?: number) {
        super(model,genericDecodeTo<T>(payload,model),false);
        this._inputIndex = inputIndex;
        this._outputIndex = outputIndex;
        this._payload = payload;
    }
}

export class Output<T extends object> extends BasicOutput<T>{
    constructor(model: ModelInterface<T>, report: CartesiReport | InspectReport) {
        super(model, report.payload, report.input?.index, report.index);
    }
}

export class OutputWithProof<T extends object> extends BasicOutput<T>{
    _proof: Maybe<Proof> | undefined
    _inputIndex: number
    _outputIndex: number
    
    constructor(model: ModelInterface<T>, payload: string, inputIndex: number, outputIndex: number, proof: Maybe<Proof> | undefined) {
        super(model, payload, inputIndex, outputIndex);
        this._inputIndex = inputIndex;
        this._outputIndex = outputIndex;
        this._proof = proof;
    }
}

export class Event<T extends object> extends OutputWithProof<T>{
    constructor(model: ModelInterface<T>, notice: CartesiNotice) {
        super(model, notice.payload, notice.input.index, notice.index, notice.proof);
    }
    validateOnchain = async (signer: Signer, dappAddress: string): Promise<boolean> => {
        if (this._proof == undefined)
            throw new Error("Notice has no proof");
        return await validateNoticeFromParams(signer,dappAddress,this._payload,this._proof);
    }
}

export class ContractCall<T extends object> extends OutputWithProof<T>{
    _destination: string
    constructor(model: ModelInterface<T>, voucher: CartesiVoucher) {
        super(model, voucher.payload, voucher.input.index, voucher.index, voucher.proof);
        this._destination = voucher.destination;
    }
    wasExecuted = async (signer: Signer, dappAddress: string): Promise<boolean> => {
        return await wasVoucherExecutedFromParams(signer,dappAddress,this._inputIndex,this._outputIndex);
    }
    execute = async (signer: Signer, dappAddress: string): Promise<ContractReceipt | null> => {
        if (this._proof == undefined)
            throw new Error("Voucher has no proof");
        return await executeVoucherFromParams(signer,dappAddress,this._destination,this._payload,this._proof);
    }
}


/*
 * Helpers
 */

// Advance
export async function genericAdvanceInput<T extends object>(
    client:Signer,
    dappAddress:string,
    selector:string,
    inputData: IOData<T>,
    options?:AdvanceInputOptions
):Promise<AdvanceOutput|ContractReceipt> {
    if (options == undefined) options = {};

    const payloadHex = inputData.export();
    const output = await advanceInput(client,dappAddress,selector + payloadHex.replace('0x',''),options).catch(
        e => {
            if (String(e.message).startsWith('0x'))
                throw new Error(ethers.utils.toUtf8String(e.message));
            throw new Error(e.message);
    });

    return output;
}

// Inspect
export async function inspectCall(
    payload:string,
    options:InspectOptions
):Promise<InspectReport> {
    options.decodeTo = "no-decode";
    const inspectResult: string = await inspect(payload,options).catch(
        e => {
            if (String(e.message).startsWith('0x'))
                throw new Error(ethers.utils.toUtf8String(e.message));
            throw new Error(e.message);
    }) as string; // hex string
    return {payload:inspectResult};
}

export async function genericInspect<T extends object>(
    inputData: IOData<T>,
    route: string,
    options?:InspectOptions
):Promise<InspectReport> {
    if (options == undefined) options = {};
    options.aggregate = true;
    const payload = `${route}${inputData.export()}`
    return await inspectCall(payload,options);
}

// Decode
export function genericDecodeTo<T extends object>(data: string,model: ModelInterface<T>): T {
    let dataObj: any;
    switch(model.ioType) {
        /*# case mutationPayload: {
            break;
        }
        case queryPayload: {
            break;
        }*/
        case IOType.report: {
            const dataStr = ethers.utils.toUtf8String(data);
            try {
                dataObj = JSON.parse(dataStr);
            } catch(e) {
                throw new Error(dataStr);
            }
            dataObj = JSON.parse(ethers.utils.toUtf8String(data));
            if (!model.validator(dataObj))
                throw new Error(`Data does not implement interface: ${ajv.errorsText(model.validator.errors)}`);     
            break;
        }
        case IOType.notice: {
            const dataValues = abiCoder.decode(model.abiTypes,data);
            dataObj = {};
            let ind = 0;
            for (const key of model.params) {
                dataObj[key] = dataValues[ind];
                ind++;
            }
            const dataToValidate = { ...dataObj };
            for (const k of Object.keys(dataToValidate)) {
                if (ethers.BigNumber.isBigNumber(dataToValidate[k]))
                    dataToValidate[k] = dataToValidate[k].toHexString();
            }
            if (!model.validator(dataToValidate))
                throw new Error(`Data does not implement interface: ${ajv.errorsText(model.validator.errors)}`);     
            
            break;
        }
        case IOType.voucher: {
            const abiTypes: Array<string> = ["bytes4"].concat(model.abiTypes);
            const dataValues = abiCoder.decode(abiTypes,data);
            dataObj = {};
            let ind = 0;
            for (const key of model.params) {
                if (ind == 0) continue; // skip selector
                dataObj[key] = dataValues[ind-1];
                ind++;
            }
            const dataToValidate = { ...dataObj };
            for (const k of Object.keys(dataToValidate)) {
                if (ethers.BigNumber.isBigNumber(dataToValidate[k]))
                    dataToValidate[k] = dataToValidate[k].toHexString();
            }
            if (!model.validator(dataToValidate))
                throw new Error(`Data does not implement interface: ${ajv.errorsText(model.validator.errors)}`);
            break;
        }
        default: {
            throw new Error(`Cannot convert ${model.ioType}`);
            // break;
        }
    }
    return dataObj;
}

export function decodeToConventionalTypes(data: string,modelName: string): any {
    if (!CONVENTIONAL_TYPES.includes(modelName))
        throw new Error(`Cannot decode to ${modelName}`);
    switch(modelName) {
        case "bytes": {
            if (typeof data == "string") {
                if (ethers.utils.isHexString(data))
                    return ethers.utils.arrayify(data);
                else
                    throw new Error(`Cannot decode to bytes`);
            }
            return data;
        }
        case "hex": {
            return data;
        }
        case "str": {
            return ethers.utils.toUtf8String(data);
        }
        case "int": {
            if (typeof data == "string") {
                if (ethers.utils.isHexString(data))
                    return parseInt(data, 16);
                else
                    throw new Error(`Cannot decode to int`);
            }
            if (ethers.utils.isBytes(data))
                return parseInt(ethers.utils.hexlify(data), 16);
            else
                throw new Error(`Cannot decode to int`);
        }
        case "dict": case "list": case "tuple": case "json": {
            return JSON.parse(ethers.utils.toUtf8String(data));
        }
    }
}

interface OutMap {
    [key: string]: CartesiReport | CartesiNotice | CartesiVoucher;
}
type outType = "report" | "notice" | "voucher";
type AdvanceOutputMap = Record<outType,OutMap>

export async function decodeAdvance(
    advanceResult: AdvanceOutput,
    decoder: (data: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport, modelName:string) => any,
    options?:InspectOptions): Promise<any[]>
{
    let input_index:number;
    if (advanceResult.reports.length > 0) {
        input_index = advanceResult.reports[0].input.index;
    } else if (advanceResult.notices.length > 0) {
        input_index = advanceResult.notices[0].input.index;
    } else if (advanceResult.vouchers.length > 0) {
        input_index = advanceResult.vouchers[0].input.index;
    } else {
        // Can't decode outputs (no outputs)
        return [];
    }
    const outMap: AdvanceOutputMap = {report:{},notice:{},voucher:{}};
    for (const report of advanceResult.reports) { outMap.report[report.index] = report }
    for (const notice of advanceResult.notices) { outMap.notice[notice.index] = notice }
    for (const voucher of advanceResult.vouchers) { outMap.voucher[voucher.index] = voucher }

    const indexerOutput: IndexerOutput = await indexerQuery({input_index:input_index},{...options, decode:true, decodeModel:"IndexerOutput"}) as IndexerOutput;

    const outList: any[] = [];
    for (const indOut of indexerOutput.data) {
        outList.push( decoder(outMap[indOut.output_type as outType][`${indOut.output_index}`],indOut.class_name) );
    }
    return outList
}

// indexer
export async function genericGetOutputs(
    inputData: ifaces.IndexerPayload,
    decoder: (data: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport, modelName:string) => any,
    options?:InspectOptions
):Promise<any[]> {
    if (options == undefined) options = {};
    const indexerOutput: IndexerOutput = await indexerQuery(inputData,{...options, decode:true, decodeModel:"IndexerOutput"}) as IndexerOutput;
    const graphqlQueries: Promise<any>[] = [];
    for (const outInd of indexerOutput.data) {
        const graphqlOptions: GraphqlOptions = {cartesiNodeUrl: options.cartesiNodeUrl, inputIndex: outInd.input_index, outputIndex: outInd.output_index};
        graphqlQueries.push(outputGetters[outInd.output_type](graphqlOptions).then(
            (output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport) => {
                return decoder(output,outInd.class_name);
            }
        ));
    }
    return Promise.all(graphqlQueries);
}

/*
 * Mutations/Advances
 */


/*
 * Queries/Inspects
 */

export async function indexerQuery(
    inputData: ifaces.IndexerPayload,
    options?:QueryOptions
):Promise<InspectReport|any> {
    const route = 'cartesapp/indexer_query';
    const data: IndexerPayload = new IndexerPayload(inputData);
    const output: InspectReport = await genericInspect<ifaces.IndexerPayload>(data,route,options);
    if (options?.decode) { return decodeToModel(output,options.decodeModel || "json"); }
    return output;
}




/**
 * Models Decoders/Exporters
 */

export function decodeToModel(data: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport, modelName: string): any {
    if (modelName == undefined)
        throw new Error("undefined model");
    if (CONVENTIONAL_TYPES.includes(modelName))
        return decodeToConventionalTypes(data.payload,modelName);
    const decoder = models[modelName].decoder;
    if (decoder == undefined)
        throw new Error("undefined decoder");
    return decoder(data);
}

export function exportToModel(data: any, modelName: string): string {
    const exporter = models[modelName].exporter;
    if (exporter == undefined)
        throw new Error("undefined exporter");
    return exporter(data);
}

export class IndexerPayload extends IOData<ifaces.IndexerPayload> { constructor(data: ifaces.IndexerPayload, validate: boolean = true) { super(models['IndexerPayload'],data,validate); } }
export function exportToIndexerPayload(data: ifaces.IndexerPayload): string {
    const dataToExport: IndexerPayload = new IndexerPayload(data);
    return dataToExport.export();
}

export class IndexerOutput extends Output<ifaces.IndexerOutput> { constructor(output: CartesiReport | InspectReport) { super(models['IndexerOutput'],output); } }
export function decodeToIndexerOutput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): IndexerOutput {
    return new IndexerOutput(output as CartesiReport);
}


/**
 * Model
 */

export const models: Models = {
    'IndexerPayload': {
        ioType:IOType.queryPayload,
        abiTypes:[],
        params:['tags', 'output_type', 'msg_sender', 'timestamp_gte', 'timestamp_lte', 'module', 'input_index'],
        exporter: exportToIndexerPayload,
        validator: ajv.compile<ifaces.IndexerPayload>(JSON.parse('{"title": "IndexerPayload", "type": "object", "properties": {"tags": {"type": "array", "items": {"type": "string"}}, "output_type": {"type": "string"}, "msg_sender": {"type": "string"}, "timestamp_gte": {"type": "integer"}, "timestamp_lte": {"type": "integer"}, "module": {"type": "string"}, "input_index": {"type": "integer"}}}'))
    },
    'IndexerOutput': {
        ioType:IOType.report,
        abiTypes:[],
        params:['data'],
        decoder: decodeToIndexerOutput,
        validator: ajv.compile<ifaces.IndexerOutput>(JSON.parse('{"title": "IndexerOutput", "type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/definitions/OutputIndex"}}}, "required": ["data"], "definitions": {"OutputIndex": {"title": "OutputIndex", "type": "object", "properties": {"output_type": {"type": "string"}, "module": {"type": "string"}, "class_name": {"type": "string"}, "input_index": {"type": "integer"}, "output_index": {"type": "integer"}}, "required": ["output_type", "module", "class_name", "input_index", "output_index"]}}}'))
    },
    };