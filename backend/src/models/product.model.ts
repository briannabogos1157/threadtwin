import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProductAttributes {
  id: string;
  brand: string;
  title: string;
  description: string;
  currencyCode: string;
  price: number;
  retailPrice: number;
  averageRating: number;
  totalReviews: number;
  styleNumber: string;
  isOnlinePurchasable: boolean;
  isPrivateSale: boolean;
  isUmap: boolean;
  viewingCount: number;
  productType1Code: string;
  productType1Name: string;
  productType2Code: string;
  productType2Name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'createdAt' | 'updatedAt'> {}

interface ColorAttributes {
  id: string;
  productId: string;
  colorCode: string;
  colorName: string;
  imageUrl: string;
  imageType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ColorCreationAttributes extends Optional<ColorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface BadgeAttributes {
  id: string;
  productId: string;
  text: string;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BadgeCreationAttributes extends Optional<BadgeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface PriceAttributes {
  id: string;
  productId: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  startValidDate: Date;
  endValidDate: Date;
  minPercentOff: number;
  maxPercentOff: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PriceCreationAttributes extends Optional<PriceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public brand!: string;
  public title!: string;
  public description!: string;
  public currencyCode!: string;
  public price!: number;
  public retailPrice!: number;
  public averageRating!: number;
  public totalReviews!: number;
  public styleNumber!: string;
  public isOnlinePurchasable!: boolean;
  public isPrivateSale!: boolean;
  public isUmap!: boolean;
  public viewingCount!: number;
  public productType1Code!: string;
  public productType1Name!: string;
  public productType2Code!: string;
  public productType2Name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

class Color extends Model<ColorAttributes, ColorCreationAttributes> implements ColorAttributes {
  public id!: string;
  public productId!: string;
  public colorCode!: string;
  public colorName!: string;
  public imageUrl!: string;
  public imageType!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

class Badge extends Model<BadgeAttributes, BadgeCreationAttributes> implements BadgeAttributes {
  public id!: string;
  public productId!: string;
  public text!: string;
  public type!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

class Price extends Model<PriceAttributes, PriceCreationAttributes> implements PriceAttributes {
  public id!: string;
  public productId!: string;
  public type!: string;
  public minPrice!: number;
  public maxPrice!: number;
  public startValidDate!: Date;
  public endValidDate!: Date;
  public minPercentOff!: number;
  public maxPercentOff!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  brand: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  currencyCode: DataTypes.STRING,
  price: DataTypes.DECIMAL(10, 2),
  retailPrice: DataTypes.DECIMAL(10, 2),
  averageRating: DataTypes.DECIMAL(3, 2),
  totalReviews: DataTypes.INTEGER,
  styleNumber: DataTypes.STRING,
  isOnlinePurchasable: DataTypes.BOOLEAN,
  isPrivateSale: DataTypes.BOOLEAN,
  isUmap: DataTypes.BOOLEAN,
  viewingCount: DataTypes.INTEGER,
  productType1Code: DataTypes.STRING,
  productType1Name: DataTypes.STRING,
  productType2Code: DataTypes.STRING,
  productType2Name: DataTypes.STRING
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  timestamps: true
});

Color.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.STRING,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  colorCode: DataTypes.STRING,
  colorName: DataTypes.STRING,
  imageUrl: DataTypes.STRING,
  imageType: DataTypes.STRING
}, {
  sequelize,
  modelName: 'Color',
  tableName: 'colors',
  timestamps: true
});

Badge.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.STRING,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  text: DataTypes.STRING,
  type: DataTypes.STRING
}, {
  sequelize,
  modelName: 'Badge',
  tableName: 'badges',
  timestamps: true
});

Price.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.STRING,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  type: DataTypes.STRING,
  minPrice: DataTypes.DECIMAL(10, 2),
  maxPrice: DataTypes.DECIMAL(10, 2),
  startValidDate: DataTypes.DATE,
  endValidDate: DataTypes.DATE,
  minPercentOff: DataTypes.INTEGER,
  maxPercentOff: DataTypes.INTEGER
}, {
  sequelize,
  modelName: 'Price',
  tableName: 'prices',
  timestamps: true
});

// Set up associations
Product.hasMany(Color, { foreignKey: 'productId' });
Color.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(Badge, { foreignKey: 'productId' });
Badge.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(Price, { foreignKey: 'productId' });
Price.belongsTo(Product, { foreignKey: 'productId' });

export { Product, Color, Badge, Price }; 