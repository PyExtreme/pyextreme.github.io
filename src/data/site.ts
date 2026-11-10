export const site = {
	name: 'Ankit Jha',
	role: 'Staff AI Engineer',
	yearsExperience: 7,
	summary: 'End-to-end AI systems: agents, retrieval, evaluation, inference and infrastructure',
	description:
		'Ankit Jha is a Staff AI Engineer with 7 years of experience building AI systems end to end: agents, retrieval and evaluation, down to LLM inference, request routing and the infrastructure underneath.',
	url: 'https://pyextreme.github.io',
	github: 'https://github.com/PyExtreme',
	linkedin: 'https://www.linkedin.com/in/ankitjha-42',
	email: 'ankitjha.email@gmail.com',
	/** TODO: add a résumé PDF under public/ and set its path here, e.g. '/ankit-jha-resume.pdf'. */
	resume: '',
	employers: ['PhysicsWallah', 'Paytm', 'Meesho', 'Amazon'],
};

export const navLinks = [
	{ href: '/projects/', label: 'Projects' },
	{ href: '/open-source/', label: 'Open source' },
	{ href: '/about/', label: 'About' },
];

/** Keeps hyphenated identifiers such as "llm-d-router" on one line. Returns HTML. */
export function keepIdentifiers(text: string): string {
	const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return escaped.replace(/[\w.]+(?:-[\w.]+)+/g, (token) => `<span class="nowrap">${token}</span>`);
}
