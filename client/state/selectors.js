import { createSelector } from 'reselect';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import memoize from 'lodash/memoize';
import validator from 'is-my-json-valid';
import ObjectPath from 'objectpath';
import coerceFormValues from 'lib/utils/coerce-values';

const memoizedValidator = memoize( ( schema ) => validator( schema, { greedy: true } ) );

/*
 * Errors from `is-my-json-valid` are paths to fields, all using `data` as the root.
 *
 * e.g.: `data.services.first_class_parcel.adjustment
 *
 * This removes the `data.` prepending all errors, to facilitate easier matching to form fields.
 */
const removeErrorDataPathRoot = ( errantFields ) => {
	if ( isEmpty( errantFields ) || ! isArray( errantFields ) ) {
		return [];
	}

	return errantFields.map( ( field ) => {
		const errorPath = ObjectPath.parse( field );
		if ( 'data' === errorPath[ 0 ] ) {
			return errorPath.slice( 1 );
		}
		return errorPath;
	} );
};

const getRawFormErrors = ( schema, data ) => {
	const validate = memoizedValidator( schema );
	const coerced = coerceFormValues( schema, data );
	const success = validate( coerced );

	if ( ! success && validate.errors && validate.errors.length ) {
		return validate.errors.map( ( error ) => error.field );
	}

	return [];
};

export const getFormErrors = createSelector(
	( state ) => state.form.errors,
	( state, schema ) => schema,
	( state ) => state.form.values,
	( errors, schema, data ) => removeErrorDataPathRoot( errors || getRawFormErrors( schema, data ) )
);

export const getStepFormErrors = createSelector(
	( state ) => state,
	( state, schema ) => schema,
	( state, schema, layout ) => layout,
	( state, schema, layout ) => {
		const allErrors = getFormErrors( state, schema );
		const stepLayout = layout[ state.form.currentStep ];
		const stepFields = {};
		if ( stepLayout ) {
			stepLayout.items.forEach( item => stepFields[ item.key ] = true );
		}
		return allErrors.filter( elem => stepFields[ elem[ 0 ] ] );
	}
);