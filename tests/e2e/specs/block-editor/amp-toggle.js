/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { activatePlugin, deactivatePlugin } from '../../utils';

describe( 'Enable AMP Toggle', () => {
	it( 'should display even when Gutenberg is not active', async () => {
		await deactivatePlugin( 'gutenberg' );
		await createNewPost();

		await expect( page ).toMatchElement( 'label[for="amp-enabled"]', { text: 'Enable AMP' } );

		await activatePlugin( 'gutenberg' );
	} );
} );
