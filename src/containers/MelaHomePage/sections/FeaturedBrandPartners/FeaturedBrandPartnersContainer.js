import { connect } from 'react-redux';
import { compose } from 'redux';

import FeaturedBrandPartners from './FeaturedBrandPartners';

import {
  fetchFeaturedBrands,
  getFeaturedBrandsWithProducts,
  getFeaturedBrandsInProgress,
  getFeaturedBrandsError,
} from '../../../BrandsPage/BrandsPage.duck';

const mapStateToProps = state => {
  const brandsWithProducts = getFeaturedBrandsWithProducts(state);
  const fetchInProgress = getFeaturedBrandsInProgress(state);
  const fetchError = getFeaturedBrandsError(state);

  return {
    brandsWithProducts,
    fetchInProgress,
    fetchError,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchFeaturedBrands: () => dispatch(fetchFeaturedBrands()),
});

const FeaturedBrandPartnersContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(FeaturedBrandPartners);

export default FeaturedBrandPartnersContainer;
