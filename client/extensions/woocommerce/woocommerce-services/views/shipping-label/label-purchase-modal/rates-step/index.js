/** @format */

/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { localize } from 'i18n-calypso';
import { find, isEmpty, mapValues, some } from 'lodash';
import formatCurrency from '@automattic/format-currency';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import ShippingRates from './list';
import FormLegend from 'components/forms/form-legend';
import { hasNonEmptyLeaves } from 'woocommerce/woocommerce-services/lib/utils/tree';
import {
	updateRate,
} from 'woocommerce/woocommerce-services/state/shipping-label/actions';
import {
	getShippingLabel,
	isLoaded,
	getFormErrors,
	getTotalPriceBreakdown,
} from 'woocommerce/woocommerce-services/state/shipping-label/selectors';
import { getAllPackageDefinitions } from 'woocommerce/woocommerce-services/state/packages/selectors';
import { getOrderShippingTotal } from 'woocommerce/lib/order-values/totals';
import { getOrderShippingMethod } from 'woocommerce/lib/order-values';
import { getOrder } from 'woocommerce/state/sites/orders/selectors';

const ratesSummary = ( selectedRates, availableRates, total, packagesSaved, translate ) => {
	if ( ! packagesSaved ) {
		return translate( 'Unsaved changes made to packages' );
	}

	if ( some( mapValues( availableRates, rateObject => isEmpty( rateObject.default.rates ) ) ) ) {
		return translate( 'No rates found' );
	}

	if ( ! total ) {
		return '';
	}

	const packageIds = Object.keys( selectedRates );

	// Show the service name and cost when only one service/package exists
	if ( 1 === packageIds.length ) {
		const packageId = packageIds[ 0 ];
		const selectedRate = selectedRates[ packageId ];
		const packageRates = availableRates[ packageId ].default.rates;
		const rateInfo = find( packageRates, [ 'service_id', selectedRate ] );

		if ( rateInfo ) {
			return translate( '%(serviceName)s: %(rate)s', {
				args: {
					serviceName: rateInfo.title,
					rate: formatCurrency( rateInfo.rate, 'USD' ),
				},
			} );
		}

		return '';
	}

	// Otherwise, just show the total
	return translate( 'Total rate: %(total)s', {
		args: {
			total: formatCurrency( total, 'USD' ),
		},
	} );
};

const getRatesStatus = ( { retrievalInProgress, errors, available, form } ) => {
	if ( retrievalInProgress ) {
		return { isProgress: true };
	}

	if ( hasNonEmptyLeaves( errors ) ) {
		return { isError: true };
	}

	if ( isEmpty( available ) ) {
		return {};
	}

	if ( ! form.packages.saved ) {
		return { isWarning: true };
	}

	return { isSuccess: true };
};

const showCheckoutShippingInfo = props => {
	const { shippingMethod, shippingCost, translate } = props;

	// Use a temporary HTML element in order to let the DOM API convert HTML entities into text
	const shippingMethodDiv = document.createElement( 'div' );
	shippingMethodDiv.innerHTML = shippingMethod;
	const decodedShippingMethod = shippingMethodDiv.textContent;

	if ( shippingMethod ) {
		let shippingInfo;

		if ( 0 < shippingCost ) {
			shippingInfo = translate(
				'Customer paid a {{shippingMethod/}} of {{shippingCost/}} for shipping',
				{
					components: {
						shippingMethod: (
							<span>{ decodedShippingMethod }</span>
						),
						shippingCost: (
							<span className="rates-step__shipping-info-cost">
								{ formatCurrency( shippingCost, 'USD' ) }
							</span>
						),
					},
				}
			);
		} else {
			shippingInfo = translate( 'Your customer selected {{shippingMethod/}}', {
				components: {
					shippingMethod: (
						<span className="rates-step__shipping-info-method">{ decodedShippingMethod }</span>
					),
				},
			} );
		}

		return (
			<div className="rates-step__shipping-info">
				<Gridicon icon="info-outline" />
				<div >{ shippingInfo }</div>
			</div>
		);
	}
};

const RatesStep = props => {
	const {
		siteId,
		orderId,
		form,
		allPackages,
		values,
		available,
		errors,
		translate,
	} = props;
	const updateRateHandler = ( packageId, serviceId, signatureRequired ) =>
		props.updateRate( orderId, siteId, packageId, serviceId, signatureRequired );

	return (
		<div>
			<FormLegend>{ translate( 'Shipping rates' ) }</FormLegend>
			{ ! isEmpty( available ) && showCheckoutShippingInfo( props ) }
			<ShippingRates
				id="rates"
				showRateNotice={ false }
				selectedPackages={ form.packages.selected }
				allPackages={ allPackages }
				selectedRates={ values }
				availableRates={ available }
				updateRate={ updateRateHandler }
				errors={ errors }
			/>
		</div>
	);
};

RatesStep.propTypes = {
	siteId: PropTypes.number.isRequired,
	orderId: PropTypes.number.isRequired,
	form: PropTypes.object.isRequired,
	values: PropTypes.object.isRequired,
	available: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
	updateRate: PropTypes.func.isRequired,
};

const mapStateToProps = ( state, { orderId, siteId } ) => {
	const loaded = isLoaded( state, orderId, siteId );
	const shippingLabel = getShippingLabel( state, orderId, siteId );
	const priceBreakdown = getTotalPriceBreakdown( state, orderId, siteId );
	const order = getOrder( state, orderId, siteId );

	return {
		...shippingLabel.form.rates,
		form: shippingLabel.form,
		errors: loaded && getFormErrors( state, orderId, siteId ).rates,
		ratesTotal: priceBreakdown ? priceBreakdown.total : 0,
		allPackages: getAllPackageDefinitions( state, siteId ),
		shippingCost: getOrderShippingTotal( order ),
		shippingMethod: getOrderShippingMethod( order ),
	};
};

const mapDispatchToProps = dispatch => {
	return bindActionCreators( { updateRate }, dispatch );
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)( localize( RatesStep ) );
