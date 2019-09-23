/** @format */
/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import FormTextInput from 'components/forms/form-text-input';
import FormSelect from 'components/forms/form-select';
import { map } from 'lodash';

export default class extends React.Component {
	static displayName = 'FormTextInputWithAffixesSelect';

	static propTypes = {
		noWrap: PropTypes.bool,
		prefix: PropTypes.object,
		suffix: PropTypes.object,
		affixValue: PropTypes.string,
		onSelectChange: PropTypes.func,
	};

	onChange = e => {
		this.props.onSelectChange( e );
	};

	renderAffix( affixes ) {
		const { noWrap, prefix, suffix, affixValue, onSelectChange, ...rest } = this.props;

		const keys = Object.keys( affixes );

		if ( ! keys ) {
			return null;
		}

		return <FormSelect
			onChange={ this.onChange }
			value={ affixValue }
			{ ...rest }
		>
			)
			{ map( keys, ( key ) => {
				return (
					<option label={ key } key={ key }>
						{ affixes[ key ] }
					</option>
				);
			} ) }
		</FormSelect>
	}

	render() {
		const { noWrap, prefix, suffix, affixValue, onSelectChange, ...rest } = this.props;

		return (
			<div className={ classNames( 'form-text-input-with-affixes-select', { 'no-wrap': noWrap } ) }>
				{ prefix && this.renderAffix( prefix ) }

				<FormTextInput { ...rest } />

				{ suffix && this.renderAffix( suffix ) }
			</div>
		);
	}
}
