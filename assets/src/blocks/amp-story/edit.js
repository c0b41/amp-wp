/**
 * External dependencies
 */
import uuid from 'uuid/v4';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	PanelColorSettings,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import { Component, Fragment } from '@wordpress/element';
import {
	PanelBody,
	Button,
	BaseControl,
	FocalPointPicker,
	SelectControl,
	RangeControl,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getTotalAnimationDuration } from '../../helpers';
import {
	ALLOWED_CHILD_BLOCKS,
	ALLOWED_MEDIA_TYPES,
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	POSTER_ALLOWED_MEDIA_TYPES,
} from '../../constants';

const TEMPLATE = [
	[ 'amp/amp-story-text' ],
];

class EditPage extends Component {
	constructor( props ) {
		// Call parent constructor.
		super( props );

		if ( ! props.attributes.anchor ) {
			this.props.setAttributes( { anchor: uuid() } );
		}

		this.onSelectMedia = this.onSelectMedia.bind( this );
	}

	onSelectMedia( media ) {
		if ( ! media || ! media.url ) {
			this.props.setAttributes( { mediaUrl: undefined, mediaId: undefined, mediaType: undefined, poster: undefined } );
			return;
		}

		let mediaType;

		// For media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === VIDEO_BACKGROUND_TYPE ) {
				mediaType = VIDEO_BACKGROUND_TYPE;
			} else {
				mediaType = IMAGE_BACKGROUND_TYPE;
			}
		} else {
			// For media selections originated from existing files in the media library.
			if (
				media.type !== IMAGE_BACKGROUND_TYPE &&
				media.type !== VIDEO_BACKGROUND_TYPE
			) {
				return;
			}

			mediaType = media.type;
		}

		this.props.setAttributes( {
			mediaUrl: media.url,
			mediaId: media.id,
			mediaType,
		} );

		if ( IMAGE_BACKGROUND_TYPE === mediaType ) {
			this.props.setAttributes( { poster: undefined } );
		}
	}

	render() {
		const { attributes, media, setAttributes, totalAnimationDuration } = this.props;

		const {
			gradientBottomColor,
			mediaId,
			mediaType,
			mediaUrl,
			focalPoint,
			overlayColor,
			overlayOpacity,
			poster,
			autoAdvanceAfter,
			autoAdvanceAfterDuration,
		} = attributes;

		const instructions = <p>{ __( 'To edit the background image or video, you need permission to upload media.', 'amp' ) }</p>;

		const style = {
			backgroundImage: IMAGE_BACKGROUND_TYPE === mediaType && mediaUrl ? `url(${ mediaUrl })` : undefined,
			backgroundPosition: IMAGE_BACKGROUND_TYPE === mediaType && focalPoint ? `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%` : 'cover',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
		};

		if ( VIDEO_BACKGROUND_TYPE === mediaType && poster ) {
			style.backgroundImage = `url(${ poster })`;
		}

		const autoAdvanceAfterOptions = [
			{ value: '', label: __( 'Manual', 'amp' ) },
			{ value: 'auto', label: __( 'Automatic', 'amp' ) },
			{ value: 'time', label: __( 'After a certain time', 'amp' ) },
			{ value: 'media', label: __( 'After media has played', 'amp' ) },
		];

		let autoAdvanceAfterHelp;

		if ( 'media' === autoAdvanceAfter ) {
			autoAdvanceAfterHelp = __( 'Based on the first media block encountered on the page', 'amp' );
		} else if ( 'auto' === autoAdvanceAfter ) {
			autoAdvanceAfterHelp = __( 'Based on the duration of all animated blocks on the page', 'amp' );
		}

		const overlayStyle = {
			width: '100%',
			height: '100%',
		};
		if ( ! gradientBottomColor && overlayColor ) {
			overlayStyle.backgroundColor = overlayColor;
			overlayStyle.opacity = overlayOpacity / 100;
		} else if ( gradientBottomColor ) {
			const topColor = overlayColor ? overlayColor : 'transparent';
			overlayStyle.backgroundImage = `linear-gradient(to bottom, ${ topColor }, ${ gradientBottomColor })`;
			overlayStyle.opacity = overlayOpacity / 100;
		}

		return (
			<Fragment>
				<InspectorControls key="controls">
					<PanelColorSettings
						title={ __( 'Overlay Settings', 'amp' ) }
						initialOpen={ false }
						colorSettings={ [
							{
								value: overlayColor,
								onChange: ( value ) => setAttributes( { overlayColor: value } ),
								label: __( 'Color', 'amp' ),
							},
							{
								value: gradientBottomColor,
								onChange: ( value ) => setAttributes( { gradientBottomColor: value } ),
								label: __( 'Bottom Color: Use for Gradient Only', 'amp' ),
							},
						] }
					>
						<RangeControl
							label={ __( 'Opacity', 'amp' ) }
							value={ overlayOpacity }
							onChange={ ( value ) => setAttributes( { overlayOpacity: value } ) }
							min={ 0 }
							max={ 100 }
							step={ 5 }
							required
						/>
					</PanelColorSettings>
					<PanelBody title={ __( 'Background Media', 'amp' ) }>
						<Fragment>
							<BaseControl>
								<MediaUploadCheck fallback={ instructions }>
									<MediaUpload
										onSelect={ this.onSelectMedia }
										allowedTypes={ ALLOWED_MEDIA_TYPES }
										value={ mediaId }
										render={ ( { open } ) => (
											<Button isDefault isLarge onClick={ open } className="editor-amp-story-page-background">
												{ mediaUrl ? __( 'Edit Media', 'amp' ) : __( 'Select Media', 'amp' ) }
											</Button>
										) }
									/>
								</MediaUploadCheck>
								{ !! mediaId &&
								<MediaUploadCheck>
									<Button onClick={ () => setAttributes( { mediaUrl: undefined, mediaId: undefined, mediaType: undefined } ) } isLink isDestructive>
										{ VIDEO_BACKGROUND_TYPE === mediaType ? __( 'Remove video', 'amp' ) : __( 'Remove image', 'amp' ) }
									</Button>
								</MediaUploadCheck>
								}
							</BaseControl>
							{ VIDEO_BACKGROUND_TYPE === mediaType && (
								<MediaUploadCheck>
									<BaseControl
										id="editor-amp-story-page-poster"
										label={ __( 'Poster Image (required)', 'amp' ) }
										help={ __( 'The recommended dimensions for a poster image are: 720p (720w x 1280h)', 'amp' ) }
									>
										<MediaUpload
											title={ __( 'Select Poster Image', 'amp' ) }
											onSelect={ ( image ) => setAttributes( { poster: image.url } ) }
											allowedTypes={ POSTER_ALLOWED_MEDIA_TYPES }
											render={ ( { open } ) => (
												<Button
													isDefault
													onClick={ open }
													className="editor-amp-story-page-background"
												>
													{ ! poster ? __( 'Select Poster Image', 'amp' ) : __( 'Replace image', 'amp' ) }
												</Button>
											) }
										/>
										{ poster &&
										<Button
											onClick={ () => setAttributes( { poster: undefined } ) }
											isLink
											isDestructive>
											{ __( 'Remove Poster Image', 'amp' ) }
										</Button>
										}
									</BaseControl>
								</MediaUploadCheck>
							) }
							{ mediaUrl && (
								<Fragment>
									{ /* Note: FocalPointPicker is only available in Gutenberg 5.1+ */ }
									{ IMAGE_BACKGROUND_TYPE === mediaType && FocalPointPicker && (
										<FocalPointPicker
											label={ __( 'Focal Point Picker', 'amp' ) }
											url={ mediaUrl }
											value={ focalPoint }
											onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
										/>
									) }
								</Fragment>
							) }
						</Fragment>
					</PanelBody>
					<PanelBody title={ __( 'Page Settings', 'amp' ) }>
						<SelectControl
							label={ __( 'Advance to next page', 'amp' ) }
							help={ autoAdvanceAfterHelp }
							value={ autoAdvanceAfter }
							options={ autoAdvanceAfterOptions }
							onChange={ ( value ) => {
								setAttributes( { autoAdvanceAfter: value } );
								setAttributes( { autoAdvanceAfterDuration: totalAnimationDuration } );
							} }
						/>
						{ 'time' === autoAdvanceAfter && (
							<RangeControl
								label={ __( 'Time in seconds', 'amp' ) }
								value={ autoAdvanceAfterDuration ? parseInt( autoAdvanceAfterDuration ) : 0 }
								onChange={ ( value ) => setAttributes( { autoAdvanceAfterDuration: value } ) }
								min={ Math.max( totalAnimationDuration, 1 ) }
								initialPosition={ totalAnimationDuration }
								help={ totalAnimationDuration > 1 ? __( 'A minimum time is enforced because there are animated blocks on this page', 'amp' ) : undefined }
							/>
						) }
					</PanelBody>
				</InspectorControls>
				<div key="contents" style={ style }>
					{ /* todo: show poster image as background-image instead */ }
					{ VIDEO_BACKGROUND_TYPE === mediaType && media && ! poster && (
						<div className="editor-amp-story-page-video-wrap">
							<video autoPlay muted loop className="editor-amp-story-page-video">
								<source src={ mediaUrl } type={ media.mime_type } />
							</video>
						</div>
					) }
					{ ( overlayColor || gradientBottomColor ) && (
						<div style={ overlayStyle }></div>
					) }
					<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED_CHILD_BLOCKS } />
				</div>
			</Fragment>
		);
	}
}

export default withSelect( ( select, { attributes, clientId } ) => {
	const { getMedia } = select( 'core' );
	const { getBlockRootClientId } = select( 'core/editor' );
	const { getAnimatedBlocks } = select( 'amp/story' );

	const { mediaId } = attributes;

	const animatedBlocks = getAnimatedBlocks();
	const animatedBlocksPerPage = ( animatedBlocks[ clientId ] || [] ).filter( ( { id } ) => clientId === getBlockRootClientId( id ) );
	const totalAnimationDuration = getTotalAnimationDuration( animatedBlocksPerPage );
	const totalAnimationDurationInSeconds = Math.ceil( totalAnimationDuration / 1000 );

	return {
		media: mediaId ? getMedia( mediaId ) : null,
		totalAnimationDuration: totalAnimationDurationInSeconds,
	};
} )( EditPage );
