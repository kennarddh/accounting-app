const CreateArrayConditional = <T>(...raw: [boolean, T][]) =>
	raw.filter(item => item[0]).map(item => item[1])

export default CreateArrayConditional
