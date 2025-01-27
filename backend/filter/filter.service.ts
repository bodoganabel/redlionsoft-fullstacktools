import { type Filter } from "mongodb";
import { EFilterOperator } from "../../frontend/ui/filter/filter.types";

// Creating Filter Queries for datatables
export class FilterService {
  static createMongoFilter(
    filters: { field: string; operator: EFilterOperator; value: string }[]
  ): Filter<any> {
    const validFilters = filters.filter((f) => f.operator && f.value);
    if (!validFilters.length) return {};

    const conditions = validFilters
      .map((filter) => {
        const { field, operator, value } = filter;

        switch (operator) {
          case EFilterOperator.contains:
            return { [field]: { $regex: value, $options: "i" } };
          case EFilterOperator.is:
            return { [field]: value };
          case EFilterOperator.is_not:
            return { [field]: { $ne: value } };
          case EFilterOperator.greater_than:
            return { [field]: { $gt: value } };
          case EFilterOperator.less_than:
            return { [field]: { $lt: value } };
          case EFilterOperator.between:
            const [min, max] = value.split(",").map((v) => v.trim());
            return { [field]: { $gte: min, $lte: max } };
          case EFilterOperator.has_any_value:
            return { [field]: { $exists: true, $ne: null } };
          default:
            return null;
        }
      })
      .filter(Boolean);

    return conditions.length ? { $and: conditions } : {};
  }
}
