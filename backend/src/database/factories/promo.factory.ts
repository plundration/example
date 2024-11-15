import { setSeederFactory } from 'typeorm-extension';
import { Promo } from '@/database/entities/promo.entity';

export default setSeederFactory(Promo, (faker) => {
    const promo = new Promo();

    promo.code = faker.string.alphanumeric({ length: 6, casing: 'upper' });
    promo.discountPercent = faker.number.int({ min: 1, max: 5 }) * 10;
    promo.enabled = true;

    return promo;
});
