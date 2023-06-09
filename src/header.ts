import { e_ident, e_type, e_machine, e_machine_strings, p_type, sh_type, EI_OSABI_STRINGS, sh_flags, st_type, st_bindings, st_visibility, p_flags, d_tag } from './constants';
import { readString, arrayToTR } from './utils';
import { Buffer } from 'buffer';

/**
 * Options for encoding/decoding ELF headers from Buffers
 */
export interface EncodeOptions {
	isLE: boolean;
	is32bit: boolean;
}

/**
 * Constructor type for ELF elements
 */
export type ELFElementConstructor<T extends ELFElement> = {
	SH_TYPES: sh_type[];
	FromBuffer(buffer: Buffer, elf?: ELF): T;
};

/**
 * Base clase for ELF elements
 */
export abstract class ELFElement {
	constructor(public buffer: Buffer, public elf?: ELF) {}

	/**
	 * Gets a DataView representing the current element's buffer
	 */
	protected get view(): DataView {
		return new DataView(this.buffer.buffer);
	}

	/**
	 * Whether the current element is little endian or big endian
	 */
	public get isLE(): boolean {
		return this.elf.isLE;
	}

	/**
	 * Whether the current element is 32 bit
	 */
	public get is32bit(): boolean {
		return this.elf.is32bit;
	}

	/**
	 * Get a string representation of the current element
	 */
	public abstract toString(): string;

	/**
	 * Get a HTML representation of the current element
	 */
	public abstract toHTML(): HTMLElement;

	/**
	 * Returns a buffer representing the current element
	 * @param options
	 * @returns the encoded buffer
	 */
	public toBuffer(options?: EncodeOptions): Buffer {
		return Buffer.from(this.buffer);
	}

	/**
	 * The different section header types represented by this element type
	 */
	public static SH_TYPES: sh_type[];

	public static FromBuffer(buffer: Buffer, elf?: ELF): ELFElement {
		throw new ReferenceError('Cannot call FromBuffer on ELFElement directly!');
	}
}

export class ELFHeader extends ELFElement {
	private constructor(buffer: Buffer) {
		super(buffer);
	}

	public override get isLE(): boolean {
		return this.ident[e_ident.DATA] == 1;
	}

	public override get is32bit(): boolean {
		return this.ident[e_ident.CLASS] == 1;
	}

	public get ident(): { [key in e_ident]: number } {
		return {
			[e_ident.MAG0]: this.view.getUint8(0),
			[e_ident.MAG1]: this.view.getUint8(1),
			[e_ident.MAG2]: this.view.getUint8(2),
			[e_ident.MAG3]: this.view.getUint8(3),
			[e_ident.CLASS]: this.view.getUint8(4),
			[e_ident.DATA]: this.view.getUint8(5),
			[e_ident.VERSION]: this.view.getUint8(6),
			[e_ident.OSABI]: this.view.getUint8(7),
			[e_ident.ABIVERSION]: this.view.getUint8(8),
		};
	}

	public get type(): e_type {
		return this.view.getUint16(0x10, this.isLE);
	}

	public get machine(): e_machine {
		return this.view.getUint16(0x12, this.isLE);
	}

	public get version(): number {
		return this.view.getUint32(0x14, this.isLE); // e_version
	}

	public get entry(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x18, this.isLE) : this.view.getBigUint64(0x18, this.isLE);
	}

	public get phoff(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x1c, this.isLE) : this.view.getBigUint64(0x20, this.isLE);
	}

	public get shoff(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x20, this.isLE) : this.view.getBigUint64(0x28, this.isLE);
	}

	public get flags(): number {
		return this.view.getUint32(this.is32bit ? 0x24 : 0x30, this.isLE);
	}

	public get ehsize(): number {
		return this.view.getUint16(this.is32bit ? 0x28 : 0x34, this.isLE);
	}

	public get phentsize(): number {
		return this.view.getUint16(this.is32bit ? 0x2a : 0x36, this.isLE);
	}

	public get phnum(): number {
		return this.view.getUint16(this.is32bit ? 0x2c : 0x38, this.isLE);
	}

	public get shentsize(): number {
		return this.view.getUint16(this.is32bit ? 0x2e : 0x3a, this.isLE);
	}

	public get shnum(): number {
		return this.view.getUint16(this.is32bit ? 0x30 : 0x3c, this.isLE);
	}

	public get shstrndx(): number {
		return this.view.getUint16(this.is32bit ? 0x32 : 0x3e, this.isLE);
	}

	public set type(val: e_type) {
		this.view.setUint16(0x10, val, this.isLE);
	}

	public set machine(val: e_machine) {
		this.view.setUint16(0x12, val, this.isLE);
	}

	public set version(val: number) {
		this.view.setUint32(0x14, val, this.isLE); // e_version
	}

	public set entry(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x18, val, this.isLE) : this.view.setBigUint64(0x18, val, this.isLE);
	}

	public set phoff(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x1c, val, this.isLE) : this.view.setBigUint64(0x20, val, this.isLE);
	}

	public set shoff(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x20, val, this.isLE) : this.view.setBigUint64(0x28, val, this.isLE);
	}

	public set flags(val: number) {
		this.view.setUint32(this.is32bit ? 0x24 : 0x30, val, this.isLE);
	}

	public set ehsize(val: number) {
		this.view.setUint16(this.is32bit ? 0x28 : 0x34, val, this.isLE);
	}

	public set phentsize(val: number) {
		this.view.setUint16(this.is32bit ? 0x2a : 0x36, val, this.isLE);
	}

	public set phnum(val: number) {
		this.view.setUint16(this.is32bit ? 0x2c : 0x38, val, this.isLE);
	}

	public set shentsize(val: number) {
		this.view.setUint16(this.is32bit ? 0x2e : 0x3a, val, this.isLE);
	}

	public set shnum(val: number) {
		this.view.setUint16(this.is32bit ? 0x30 : 0x3c, val, this.isLE);
	}

	public set shstrndx(val: number) {
		this.view.setUint16(this.is32bit ? 0x32 : 0x3e, val, this.isLE);
	}

	public toString(): string {
		return `\
		Magic: 0x${this.ident[e_ident.MAG0].toString(16)} \
		${String.fromCharCode(this.ident[e_ident.MAG1])} \
		${String.fromCharCode(this.ident[e_ident.MAG2])} \
		${String.fromCharCode(this.ident[e_ident.MAG3])}
		Class: ${this.ident[e_ident.CLASS] == 1 ? 'ELF32' : 'ELF64'}
		Endianness: ${this.ident[e_ident.DATA] == 1 ? 'Little Endian' : 'Big Endian'}
		Version: ${this.ident[e_ident.VERSION]}
		OS/ABI: ${EI_OSABI_STRINGS[this.ident[e_ident.OSABI]]}
		ABI version: ${this.ident[e_ident.ABIVERSION]}
		Type: ${e_type[this.type]}
		Machine: ${e_machine_strings[this.machine] || '0x' + this.machine.toString(16)}
		Version: 0x${this.version.toString(16)}
		Entry point: 0x${this.entry.toString(16)}
		Start of program headers: ${this.phoff} (bytes into file)
		Start of section headers: ${this.shoff} (bytes into file)
		Flags: 0x${this.flags.toString(16)}
		Header size: ${this.ehsize} (bytes)
		Program header entry size: ${this.phentsize} (bytes)
		Program header entries: ${this.phnum}
		Section header table entry size: ${this.shentsize} (bytes)
		Section header table entries: ${this.shnum}
		Section header table names index: ${this.shstrndx}`.replaceAll('\t', '');
	}

	public toHTML(): HTMLPreElement {
		const element = document.createElement('pre');
		element.innerHTML = this.toString().replaceAll('\n', '<br>');
		return element;
	}

	public toBuffer(): Buffer {
		return Buffer.from(this.buffer);
	}

	public static override FromBuffer(buffer: Buffer): ELFHeader {
		return new ELFHeader(buffer);
	}
}

export class ProgramHeader extends ELFElement {
	public constructor(buffer: Buffer, elf: ELF) {
		super(buffer, elf);
	}

	public get type(): p_type {
		return this.view.getUint32(0, this.isLE);
	}

	public get flags(): number {
		return this.view.getUint32(this.is32bit ? 0x18 : 4, this.isLE);
	}

	public get offset(): number | bigint {
		return this.is32bit ? this.view.getUint32(4, this.isLE) : this.view.getBigUint64(8, this.isLE);
	}

	public get vaddr(): number | bigint {
		return this.is32bit ? this.view.getUint32(8, this.isLE) : this.view.getBigUint64(0x10, this.isLE);
	}

	public get paddr(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x0c, this.isLE) : this.view.getBigUint64(0x18, this.isLE);
	}

	public get filesz(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x10, this.isLE) : this.view.getBigUint64(0x20, this.isLE);
	}

	public get memsz(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x14, this.isLE) : this.view.getBigUint64(0x28, this.isLE);
	}

	public get align(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x1c, this.isLE) : this.view.getBigUint64(0x30, this.isLE);
	}

	public get value(): Buffer {
		return this.elf.buffer.slice(Number(this.offset), Number(this.offset) + Number(this.filesz));
	}

	public set type(val: p_type) {
		this.view.setUint32(0, val, this.isLE);
	}

	public set flags(val: number) {
		this.view.setUint32(this.is32bit ? 0x18 : 4, val, this.isLE);
	}

	public set offset(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(4, val, this.isLE) : this.view.setBigUint64(8, val, this.isLE);
	}

	public set vaddr(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(8, val, this.isLE) : this.view.setBigUint64(0x10, val, this.isLE);
	}

	public set paddr(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x0c, val, this.isLE) : this.view.setBigUint64(0x18, val, this.isLE);
	}

	public set filesz(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x10, val, this.isLE) : this.view.setBigUint64(0x20, val, this.isLE);
	}

	public set memsz(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x14, val, this.isLE) : this.view.setBigUint64(0x28, val, this.isLE);
	}

	public set align(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0x1c, val, this.isLE) : this.view.setBigUint64(0x30, val, this.isLE);
	}

	public set value(val: Buffer) {
		val.copy(this.elf.buffer, Number(this.offset), 0, Number(this.filesz));
	}

	public hasFlag(flag: number | bigint): boolean {
		return (Number(this.flags) & Number(flag)) == Number(flag);
	}

	public toString(): string {
		return `\
				Type: ${p_type[this.type] || '0x' + this.type.toString(16)}
				Offset: ${this.offset} (bytes)
				Virtual address: 0x${this.vaddr.toString(16)}
				Physical address: 0x${this.paddr.toString(16)}
				File segment size: ${this.filesz} (bytes)
				Memory segment size: ${this.memsz} (bytes)
				Flags: ${Object.entries(p_flags)
					.filter(([text, num]) => (typeof num == 'number' && this.hasFlag(num) ? text : false))
					.join(', ')}
				Alignment: ${this.align}${this.type == p_type.INTERP ? `\n[Requesting interpreter: ${this.value.toString('utf8')}]` : ''}
			`.replaceAll('\t', '');
	}

	public toHTML(): HTMLTableRowElement {
		return arrayToTR([
			`${p_type[this.type] || '0x' + this.type.toString(16)}`,
			this.offset,
			`0x${this.vaddr.toString(16)}`,
			`0x${this.paddr.toString(16)}`,
			this.filesz,
			this.memsz,
			Object.entries(p_flags)
				.filter(([text, num]) => (typeof num == 'number' && this.hasFlag(num) ? text : false))
				.join(', '),
			this.align,
		]);
	}

	public static GetHTMLNameRow(): HTMLTableRowElement {
		return arrayToTR(['Type', 'Offset', 'Virtual Address', 'Physical Address', 'File size', 'Memory size', 'Flags', 'Alignment']);
	}

	public static override FromBuffer(buffer: Buffer, elf: ELF): ProgramHeader {
		return new ProgramHeader(buffer, elf);
	}
}

export class SectionHeader extends ELFElement {
	private constructor(buffer: Buffer, elf: ELF) {
		super(buffer, elf);
	}

	public get name(): number {
		return this.view.getUint32(0, this.isLE);
	}

	public get type(): sh_type {
		return this.view.getUint32(4, this.isLE);
	}

	public get flags(): number | bigint {
		return this.is32bit ? this.view.getUint32(8, this.isLE) : this.view.getBigUint64(8, this.isLE);
	}

	public get addr(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x0c, this.isLE) : this.view.getBigUint64(0x10, this.isLE);
	}

	public get offset(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x10, this.isLE) : this.view.getBigUint64(0x18, this.isLE);
	}

	public get size(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x14, this.isLE) : this.view.getBigUint64(0x20, this.isLE);
	}

	public get link(): number {
		return this.view.getUint32(this.is32bit ? 0x18 : 0x28, this.isLE);
	}

	public get info(): number {
		return this.view.getUint32(this.is32bit ? 0x1c : 0x2c, this.isLE);
	}

	public get addralign(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x20, this.isLE) : this.view.getBigUint64(0x30, this.isLE);
	}

	public get entsize(): number | bigint {
		return this.is32bit ? this.view.getUint32(0x24, this.isLE) : this.view.getBigUint64(0x38, this.isLE);
	}

	public get value(): Buffer {
		return this.elf.buffer.slice(Number(this.offset), Number(this.offset) + Number(this.size));
	}

	public hasFlag(flag: number | bigint): boolean {
		return (Number(this.flags) & Number(flag)) == Number(flag);
	}

	public getName(): string {
		return readString(this.elf.sectionHeaders[this.elf.header.shstrndx].value, this.name);
	}

	public getData<T extends ELFElement>(elfElement: ELFElementConstructor<T>): T[] {
		const result = [],
			value = this.value;

		if (!elfElement.SH_TYPES.includes(this.type)) {
			throw new TypeError('Invalid type');
		}

		for (let i = 0; i < this.size; i += Number(this.entsize)) {
			const entBuffer = Buffer.from(value.slice(i, i + Number(this.entsize)));
			const ent = elfElement.FromBuffer(entBuffer, this.elf);
			result.push(ent);
		}

		return result;
	}

	public toString(): string {
		return `\
				[${this.elf?.sectionHeaders?.indexOf(this)}] \
				Name: ${this.getName() || `Unknown (at 0x${this.name.toString(16)})`}
				Type: ${sh_type[this.type] || '0x' + this.type.toString(16)}
				Address: 0x${this.addr.toString(16)}
				Flags: ${Object.entries(sh_flags)
					.filter(([text, num]) => (typeof num == 'number' && this.hasFlag(num) ? text : false))
					.join(', ')}
				Offset: ${this.offset} (bytes)
				Size: ${this.size} (bytes)
				Link: ${this.link}
				Info: ${this.info}
				Address alignment: ${this.addralign}
				Entry size: ${this.entsize}
			`.replaceAll('\t', '');
	}

	public toHTML(): HTMLTableRowElement {
		return arrayToTR([
			this.elf.sectionHeaders.indexOf(this),
			this.getName() || `Unknown (at 0x${this.name.toString(16)})`,
			`${sh_type[this.type] || '0x' + this.type.toString(16)}`,
			`0x${this.addr.toString(16)}`,
			Object.entries(sh_flags)
				.filter(([text, num]) => (typeof num == 'number' && this.hasFlag(num) ? text : false))
				.join(', '),
			this.offset,
			this.size,
			this.link,
			this.info,
			this.addralign,
			this.entsize,
		]);
	}

	public static GetHTMLNameRow(): HTMLTableRowElement {
		return arrayToTR(['No.', 'Name', 'Type', 'Address', 'Flags', 'Offset', 'Size', 'Link', 'Info', 'Align', 'Entry size']);
	}

	public static override FromBuffer(buffer: Buffer, elf: ELF): SectionHeader {
		return new SectionHeader(buffer, elf);
	}
}

export class Symbol extends ELFElement {
	private constructor(buffer: Buffer, elf: ELF) {
		super(buffer, elf);
	}

	public get name(): number {
		return this.view.getUint32(0, this.isLE);
	}

	public get value(): number | bigint {
		return this.is32bit ? this.view.getUint32(4, this.isLE) : this.view.getBigUint64(8, this.isLE);
	}

	public get size(): number | bigint {
		return this.is32bit ? this.view.getUint32(8, this.isLE) : this.view.getBigUint64(16, this.isLE);
	}

	public get info(): number {
		return this.view.getUint8(this.is32bit ? 12 : 4);
	}

	public get other(): number {
		return this.view.getUint8(this.is32bit ? 13 : 5);
	}

	public get shndx(): number {
		return this.view.getUint16(this.is32bit ? 14 : 6, this.isLE);
	}

	public set name(val: number) {
		this.view.setUint32(0, val, this.isLE);
	}

	public set value(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(4, val, this.isLE) : this.view.setBigUint64(8, val, this.isLE);
	}

	public set size(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(8, val, this.isLE) : this.view.setBigUint64(16, val, this.isLE);
	}

	public set info(val: number) {
		this.view.setUint8(this.is32bit ? 12 : 4, val);
	}

	public set other(val: number) {
		this.view.setUint8(this.is32bit ? 13 : 5, val);
	}

	public set shndx(val: number) {
		this.view.setUint16(this.is32bit ? 14 : 6, val, this.isLE);
	}

	public toString(): string {
		const strtab = this.elf && this.elf.getSectionHeaderByName('.strtab');
		const names = strtab?.value;
		return `\
		Name: ${names ? readString(names, this.name) : `Unknown (at 0x${this.name.toString(16)})`}
		Type: ${st_type[this.info & 0xf]}
		Bind: ${st_bindings[this.info >> 4]}
		Visibility: ${st_visibility[this.other]}
		Size: ${this.size}
		Index: ${this.shndx == 0xfff1 ? 'ABS' : this.shndx}
		Value: 0x${this.value.toString(16)}
		`.replaceAll('\t', '');
	}

	public toHTML(): HTMLTableRowElement {
		const strtab = this.elf && this.elf.getSectionHeaderByName('.strtab');
		const names = strtab?.value;

		return arrayToTR([
			'0x' + this.value.toString(16),
			st_type[this.info & 0xf],
			st_bindings[this.info >> 4],
			st_visibility[this.other],
			this.size,
			this.shndx == 0xfff1 ? 'ABS' : this.shndx,
			names ? readString(names, this.name) : `Unknown (at 0x${this.name.toString(16)})`,
		]);
	}

	public static override SH_TYPES = [sh_type.SYMTAB, sh_type.DYNSYM];

	public static GetHTMLNameRow(): HTMLTableRowElement {
		return arrayToTR(['Value', 'Type', 'Bind', 'Visibility', 'Size', 'Index', 'Name']);
	}

	public static override FromBuffer(buffer: Buffer, elf: ELF): Symbol {
		return new Symbol(buffer, elf);
	}
}

export class Rel extends ELFElement {
	private constructor(buffer: Buffer, elf: ELF, public needsAddend: boolean) {
		super(buffer, elf);
	}

	public get offset(): number | bigint {
		return this.is32bit ? this.view.getUint32(0, this.isLE) : this.view.getBigUint64(0, this.isLE);
	}

	public get info(): number | bigint {
		return this.is32bit ? this.view.getUint32(4, this.isLE) : this.view.getBigUint64(8, this.isLE);
	}

	public get added(): number | bigint {
		return this.needsAddend && (this.is32bit ? this.view.getUint32(8, this.isLE) : this.view.getBigUint64(16, this.isLE));
	}

	public set offset(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0, val, this.isLE) : this.view.setBigUint64(0, val, this.isLE);
	}

	public set info(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(4, val, this.isLE) : this.view.setBigUint64(8, val, this.isLE);
	}

	public set added(val: number | bigint) {
		this.needsAddend && (typeof val == 'number' ? this.view.setUint32(8, val, this.isLE) : this.view.setBigUint64(16, val, this.isLE));
	}

	public toString(): string {
		return `\
		Offset: 0x${this.offset.toString(16)}
		Info: 0x${this.offset.toString(16)}
		`.replaceAll('\t', '');
	}

	public toHTML(): HTMLTableRowElement {
		return arrayToTR(['0x' + this.offset.toString(), 'ox' + this.info.toString()]);
	}

	public static override SH_TYPES = [sh_type.REL, sh_type.RELA];

	public static GetHTMLNameRow(): HTMLTableRowElement {
		return arrayToTR(['Offset', 'Info']);
	}

	public static override FromBuffer(buffer: Buffer, elf?: ELF, needsAddend?: boolean): Rel {
		return new Rel(buffer, elf, needsAddend);
	}
}

export class Dyn extends ELFElement {
	private constructor(buffer: Buffer, elf: ELF) {
		super(buffer, elf);
	}

	public get tag(): number | bigint {
		return this.is32bit ? this.view.getUint32(0, this.isLE) : this.view.getBigUint64(0, this.isLE);
	}

	public get val(): number | bigint {
		return this.is32bit ? this.view.getUint32(4, this.isLE) : this.view.getBigUint64(8, this.isLE);
	}

	public get ptr(): number | bigint {
		return this.val;
	}

	public set tag(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0, val, this.isLE) : this.view.setBigUint64(0, val, this.isLE);
	}

	public set val(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(4, val, this.isLE) : this.view.setBigUint64(8, val, this.isLE);
	}

	public set ptr(val: number | bigint) {
		this.val = val;
	}

	public toString(): string {
		return `\
		Tag: 0x${this.tag.toString(16)}
		Type: ${d_tag[Number(this.tag)]}
		Value: 0x${this.val.toString(16)}
		`.replaceAll('\t', '');
	}

	public toHTML(): HTMLTableRowElement {
		return arrayToTR(['0x' + this.tag.toString(16), d_tag[Number(this.tag)], '0x' + this.val.toString(16)]);
	}

	public static override SH_TYPES = [sh_type.DYNAMIC];

	public static GetHTMLNameRow(): HTMLTableRowElement {
		return arrayToTR(['Tag', 'Type', 'Value']);
	}

	public static override FromBuffer(buffer: Buffer, elf: ELF): Dyn {
		return new Dyn(buffer, elf);
	}
}

export class Note extends ELFElement {
	private constructor(buffer: Buffer, elf: ELF) {
		super(buffer, elf);
	}

	public get namesz(): number | bigint {
		return this.is32bit ? this.view.getUint32(0, this.isLE) : this.view.getBigUint64(0, this.isLE);
	}

	public get descsz(): number | bigint {
		return this.is32bit ? this.view.getUint32(4, this.isLE) : this.view.getBigUint64(8, this.isLE);
	}

	public get type(): number | bigint {
		return this.is32bit ? this.view.getUint32(8, this.isLE) : this.view.getBigUint64(16, this.isLE);
	}

	public set namesz(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(0, val, this.isLE) : this.view.setBigUint64(0, val, this.isLE);
	}

	public set descsz(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(4, val, this.isLE) : this.view.setBigUint64(8, val, this.isLE);
	}

	public set type(val: number | bigint) {
		typeof val == 'number' ? this.view.setUint32(8, val, this.isLE) : this.view.setBigUint64(16, val, this.isLE);
	}

	public toString(): string {
		return `\
		Name size: ${this.namesz}
		Desc size: ${this.descsz}
		`.replaceAll('\t', '');
	}

	public toHTML(): HTMLTableRowElement {
		return arrayToTR([this.namesz, this.descsz]);
	}

	public static override SH_TYPES = [sh_type.NOTE];

	public static GetHTMLNameRow(): HTMLTableRowElement {
		return arrayToTR(['Name size', 'Desc size']);
	}

	public static override FromBuffer(buffer: Buffer, elf: ELF): Note {
		return new Note(buffer, elf);
	}
}

export class ELF extends ELFElement {
	public sectionHeaders: SectionHeader[] = [];
	public programHeaders: ProgramHeader[] = [];
	private constructor(buffer: Buffer, public header: ELFHeader) {
		super(buffer);
	}

	public override elf = this;

	public override get isLE(): boolean {
		return this.header.isLE;
	}

	public override get is32bit(): boolean {
		return this.header.is32bit;
	}

	public getSectionHeaderByName(name: string): SectionHeader {
		const names = this.sectionHeaders[this.header.shstrndx].value;
		return this.sectionHeaders.find(sh => readString(names, sh.name) == name);
	}

	public getSectionHeadersByType(type: sh_type): SectionHeader[] {
		return this.sectionHeaders.filter(sh => sh.type == type);
	}

	public getSymbols(): { sh: SectionHeader; symbols: Symbol[] }[] {
		const result = [];
		for (let sh of this.getSectionHeadersByType(sh_type.SYMTAB)) {
			result.push({ sh, symbols: sh.getData(Symbol) });
		}

		return result;
	}

	public getDynamic(): { sh: SectionHeader; dynamic: Dyn[] }[] {
		const result = [];
		for (let sh of this.getSectionHeadersByType(sh_type.DYNAMIC)) {
			result.push({ sh, dynamic: sh.getData(Dyn) });
		}

		return result;
	}

	public toString(): string {
		const _symbols = this.getSymbols();
		return `
			${this.header.toString()}

			Section Headers:
			${this.sectionHeaders.map(sh => sh.toString()).join('\n')}

			Program Headers:
			${this.programHeaders.map(ph => ph.toString()).join('\n')}

			${_symbols.map(({ sh, symbols }) => `Symbol table "${sh.getName()}" has ${symbols.length} entries: \n${symbols.map(s => s.toString()).join('\n')}`).join('\n')}
		`.replaceAll('\t', '');
	}

	public toHTML(): HTMLDivElement {
		const container = document.createElement('div');

		container.append(this.header.toHTML());
		container.append(document.createElement('br'));

		const shHeading = document.createElement('pre');
		shHeading.innerText = 'Section Headers:';
		container.append(shHeading);
		const shTable = document.createElement('table');
		shTable.append(SectionHeader.GetHTMLNameRow());
		for (let sh of this.sectionHeaders) {
			shTable.append(sh.toHTML());
		}
		container.append(shTable);

		const phHeading = document.createElement('pre');
		phHeading.innerText = 'Program Headers:';
		container.append(phHeading);
		const phTable = document.createElement('table');
		phTable.append(ProgramHeader.GetHTMLNameRow());
		for (let ph of this.programHeaders) {
			phTable.append(ph.toHTML());

			if (ph.type == p_type.INTERP) {
				const row = document.createElement('tr');
				const cell = document.createElement('td');
				const interp = document.createElement('div');
				interp.innerHTML = '&nbsp'.repeat(4) + `[Requesting program interpreter: ${ph.value.toString('utf8')}]`;
				interp.style.cssText = `max-width: 0;overflow: visible;white-space: nowrap;`;
				cell.append(interp);
				row.append(cell);
				phTable.append(row);
			}
		}
		container.append(phTable);

		for (let { sh, symbols } of this.getSymbols()) {
			const stContainer = document.createElement('div');
			const stHeading = document.createElement('pre');
			stHeading.innerText = `Symbol table "${sh.getName()}" has ${symbols.length} entries:`;
			stContainer.append(stHeading);
			const stTable = document.createElement('table');
			const row = Symbol.GetHTMLNameRow();
			const num = document.createElement('td');
			num.innerText = 'Num';
			row.prepend(num);
			stTable.append(row);
			for (let symbol of symbols) {
				const row = symbol.toHTML();
				const num = document.createElement('td');
				num.innerText = symbols.indexOf(symbol).toString();
				row.prepend(num);
				stTable.append(row);
			}
			stContainer.append(stTable);
			container.append(stContainer);
		}

		for (let { sh, dynamic } of this.getDynamic()) {
			const dynContainer = document.createElement('div');
			const dynHeading = document.createElement('pre');
			dynHeading.innerText = `Dynamic section "${sh.getName()}" has ${dynamic.length} entries:`;
			dynContainer.append(dynHeading);
			const dynTable = document.createElement('table');
			const row = Dyn.GetHTMLNameRow();
			dynTable.append(row);
			for (let dyn of dynamic) {
				dynTable.append(dyn.toHTML());
			}
			dynContainer.append(dynTable);
			container.append(dynContainer);
		}

		for (let td of Array.from(container.getElementsByTagName('td'))) {
			td.style.paddingRight = '1em';
		}

		return container;
	}

	public static FromBuffer(bufferLike: ArrayBufferLike) {
		const buffer = Buffer.from(bufferLike),
			header = ELFHeader.FromBuffer(buffer),
			elf = new ELF(buffer, header);

		for (let i = Number(header.shoff); i < Number(header.shoff) + header.shnum * header.shentsize; i += header.shentsize) {
			const shRaw = Buffer.from(buffer.slice(i, i + header.shentsize));
			const sh = SectionHeader.FromBuffer(shRaw, elf);
			elf.sectionHeaders.push(sh);
		}

		for (let i = Number(header.phoff); i < Number(header.phoff) + header.phnum * header.phentsize; i += header.phentsize) {
			const phRaw = Buffer.from(buffer.slice(i, i + header.phentsize));
			const ph = ProgramHeader.FromBuffer(phRaw, elf);
			elf.programHeaders.push(ph);
		}

		return elf;
	}
}
