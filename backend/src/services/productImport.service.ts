import { Product, Color, Badge, Price } from '../models/product.model';

export class ProductImportService {
  async importProduct(data: any) {
    try {
      // Create the main product
      const product = await Product.create({
        id: data.extra.apiProduct.Id,
        brand: data.brand,
        title: data.extra.apiProduct.Title,
        description: data.description,
        currencyCode: data.currencyCode,
        price: data.extra.apiProduct.OfferV1Price.regular.priceRange.min.units,
        retailPrice: data.extra.apiProduct.OfferV1Price.regular.priceRange.max.units,
        averageRating: data.extra.apiProduct.AverageRating,
        totalReviews: data.extra.apiProduct.TotalReviews,
        styleNumber: data.extra.apiProduct.StyleNumber,
        isOnlinePurchasable: data.extra.apiProduct.IsOnlinePurchasable,
        isPrivateSale: data.extra.apiProduct.IsPrivateSale,
        isUmap: data.extra.apiProduct.IsUmap,
        viewingCount: data.extra.apiProduct.ViewingCount,
        productType1Code: data.extra.apiProduct.ProductType1?.Code,
        productType1Name: data.extra.apiProduct.ProductType1?.Name,
        productType2Code: data.extra.apiProduct.ProductType2?.Code,
        productType2Name: data.extra.apiProduct.ProductType2?.Name
      });

      // Import colors
      if (data.extra.apiProduct.Colors) {
        for (const color of data.extra.apiProduct.Colors) {
          for (const shot of color.OrderedShots) {
            await Color.create({
              productId: product.id,
              colorCode: color.ColorCode,
              colorName: color.ColorName,
              imageUrl: shot.Url,
              imageType: shot.Name
            });
          }
        }
      }

      // Import badges
      if (data.extra.apiProduct.Badges) {
        for (const badge of data.extra.apiProduct.Badges) {
          await Badge.create({
            productId: product.id,
            text: badge.Text,
            type: badge.Type
          });
        }
      }

      // Import prices
      if (data.extra.apiProduct.Prices) {
        for (const price of data.extra.apiProduct.Prices) {
          await Price.create({
            productId: product.id,
            type: price.Type,
            minPrice: price.MinPrice,
            maxPrice: price.MaxPrice,
            startValidDate: price.StartValidDate,
            endValidDate: price.EndValidDate,
            minPercentOff: price.MinPercentOff,
            maxPercentOff: price.MaxPercentOff
          });
        }
      }

      return product;
    } catch (error) {
      console.error('Error importing product:', error);
      throw error;
    }
  }

  async importSimplifiedProduct(data: any) {
    try {
      // Create the main product
      const product = await Product.create({
        id: data.id,
        brand: data.brand || '',
        title: data.title,
        description: '',
        currencyCode: data.currencyCode || 'USD',
        price: data.price,
        retailPrice: data.retailPrice,
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        styleNumber: data.id,
        isOnlinePurchasable: true,
        isPrivateSale: false,
        isUmap: false,
        viewingCount: 0,
        productType1Code: '',
        productType1Name: '',
        productType2Code: '',
        productType2Name: ''
      });

      // Create a default price record
      await Price.create({
        productId: product.id,
        type: 'regular',
        minPrice: data.price,
        maxPrice: data.retailPrice,
        startValidDate: new Date(),
        endValidDate: new Date(data.endDate || '2025-06-01'),
        minPercentOff: 0,
        maxPercentOff: 0
      });

      return product;
    } catch (error) {
      console.error('Error importing simplified product:', error);
      throw error;
    }
  }

  async importBulkProducts(productsData: any[]) {
    const results = [];
    for (const productData of productsData) {
      try {
        const product = productData.extra?.apiProduct ? 
          await this.importProduct(productData) :
          await this.importSimplifiedProduct(productData);
        results.push({ success: true, id: product.id });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
}

export default new ProductImportService(); 