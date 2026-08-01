import { connect } from 'react-redux';
import { compose } from 'redux';

import EarnedItsPlace from './EarnedItsPlace';

import {
  fetchFeaturedBrands,
  getFeaturedBrandsWithProducts,
  getFeaturedBrandsInProgress,
  getFeaturedBrandsError,
} from '../../../BrandsPage/BrandsPage.duck';

const mapStateToProps = state => ({
  brandsWithProducts: getFeaturedBrandsWithProducts(state),
  fetchInProgress: getFeaturedBrandsInProgress(state),
  fetchError: getFeaturedBrandsError(state),
});

const mapDispatchToProps = dispatch => ({
  onFetchFeaturedBrands: () => dispatch(fetchFeaturedBrands()),
});

const EarnedItsPlaceContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EarnedItsPlace);

export default EarnedItsPlaceContainer;
