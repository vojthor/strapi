import { getLocalScript } from '../../../utils/helpers';
import type { StrapiCommand } from '../../../types';

/**
 * `$ strapi plugin:build`
 */
const command: StrapiCommand = ({ command }) => {
  command
    .command('plugin:watch')
    .description('Watch & compile your strapi plugin for local development.')
    .option('-d, --debug', 'Enable debugging mode with verbose logs', false)
    .option('--silent', "Don't log anything", false)
    .action(getLocalScript('plugin/watch'));
};

export default command;
