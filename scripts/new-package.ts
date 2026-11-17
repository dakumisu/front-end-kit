import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const templateDir = join(root, 'templates/package');
const [id, description] = process.argv.slice(2);

if (!id || !description || process.argv.length > 4) {
    console.error('Usage: pnpm new <id> "<description>"');
    process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    console.error(
        `Invalid id "${id}": use lowercase letters, digits and dashes, starting with a letter.`,
    );
    process.exit(1);
}

const targetDir = join(root, 'packages', id);

if (existsSync(targetDir)) {
    console.error(`packages/${id} already exists.`);
    process.exit(1);
}

cpSync(templateDir, targetDir, { recursive: true });

// Function replacers keep `$` in the description literal
const fill = (text: string, desc: string): string =>
    text.replaceAll('{{id}}', () => id).replaceAll('{{description}}', () => desc);

// Quotes and backslashes in the description must not break JSON files
const jsonDescription = JSON.stringify(description).slice(1, -1);

const fillFolder = (dir: string): void => {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
            fillFolder(path);
        } else {
            const desc = name.endsWith('.json') ? jsonDescription : description;
            writeFileSync(path, fill(readFileSync(path, 'utf8'), desc));
        }
    }
};

fillFolder(targetDir);

// `{{id}}` changes README column widths, so format the filled files
execFileSync(join(root, 'node_modules/.bin/oxfmt'), [targetDir], { stdio: 'inherit' });

console.log(`Created and formatted packages/${id}. Run: pnpm install`);
