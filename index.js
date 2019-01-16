#!/usr/bin/node node

const program = require('commander');
const chalk = require('chalk');
const childProcess = require('child_process');
const fs = require('fs');

program
    .version('1.0.0');

program
    .command('grep <query> <output> <files...>')
    .description('Find matching param in files')
    .option('-c, --compress', 'Compress output file')
    .action((query, output, files, cmd) => {
        console.log(chalk.blue(`Searching for pattern ${query} in files ${files.join(', ')}.`));
        console.log(chalk.blue(`Output will be saved to ${output}`));
        if (fs.existsSync(output)) {
            fs.unlinkSync(output);
        }
        const fd = fs.openSync(output, 'a');

        files.forEach((file, index) => {
            console.log(chalk.green(`--- Parsing file ${index+1} of ${files.length}: ${file} ---`));
            fs.writeSync(fd, `\n\n--- ${file} ---\n\n`);
            try {
                const childProcessOutput = childProcess.execSync(`zipgrep -n "${query}" ${file}`);
                fs.writeSync(fd, childProcessOutput)
            } catch (e) {
                if (e.status === 1) {
                    fs.writeSync(fd, `Search query "${query}" not found`)
                } else if (e.status === 2) {
                    fs.writeSync(fd, 'Error while searching file')
                }
            }
        });

        if(cmd.compress) {
            console.log(chalk.blue(`Compressing result to ${output}.zip`));
            childProcess.execSync(`zip ${output}.zip ${output}`);
        }
    });

program.on('command:*', () => {
    console.error(chalk.red('Invalid command: ', program.args.join(' ')));
    console.error(chalk.red('See --help for a list of available commands.'));

    process.exit(1);
});

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    console.warn(chalk.red('No command specified!'));
    console.warn('');

    program.outputHelp(help => chalk.yellow(help));

    process.exit(1);
}