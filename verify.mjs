// Run with node verify.mjs. No dependencies required.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('Portfolioweb.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean);
scripts.forEach(source => new vm.Script(source));
for (const filename of ['translations.js', 'interactions.js']) new vm.Script(fs.readFileSync(new URL(filename, import.meta.url), 'utf8'));
const source = scripts.find(s => s.includes('const projects ='));
const projectSource = source.slice(source.indexOf('const projects ='), source.indexOf('const navLogo ='));
const projects = vm.runInNewContext(projectSource + '; projects');
const dictionarySource = fs.readFileSync(new URL('translations.js', import.meta.url), 'utf8').split("let language =")[0];
const dictionary = vm.runInNewContext(dictionarySource + '; chinese');
let images = 0;
for (const project of Object.values(projects)) {
    for (const field of ['kicker', 'tag', 'time', 'role', 'summary']) assert.ok(dictionary[project[field]], `Missing translation: ${project[field]}`);
    for (const paragraph of project.content.matchAll(/<p[^>]*>(.*?)<\/p>/gs)) assert.ok(dictionary[paragraph[1].trim()], `Missing paragraph: ${paragraph[1]}`);
    for (const item of [...project.mockups, ...project.gallerySections.flatMap(s => s.items)]) {
        assert.ok(fs.statSync(new URL(item.src, import.meta.url)).size > 100, `Missing/empty image: ${item.src}`);
        images++;
    }
    for (const section of project.gallerySections) assert.ok(dictionary[section.title], `Missing gallery translation: ${section.title}`);
    if (project.nextProject) assert.ok(projects[project.nextProject.id]);
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#|javascript:|\$)/.test(target)) continue;
    assert.ok(fs.existsSync(new URL(decodeURIComponent(target), import.meta.url)), `Broken local link: ${target}`);
}
assert.ok(!html.includes('james.ma@example.com'));
assert.ok(!html.includes('SKYTop.png'));
assert.ok(!html.includes('webpage.png'));
console.log(`PASS: script syntax, 5 translated projects, ${images} gallery references, local links and known broken resources.`);
