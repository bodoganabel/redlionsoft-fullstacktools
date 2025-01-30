import { type Filter } from "mongodb";
import { EFilterOperator } from "../../frontend/ui/filter/filter.types";

// Creating Filter Queries for datatables
export class FilterService {
  static createMongoFilter(
    filters: { field: string; operator: EFilterOperator; value: string }[],
    allFields: string[]
  ): Filter<any> | {} {
    console.log("createMongoFilter called with filters:", filters);
    console.log("allFields:", allFields);

    const validFilters = filters.filter((f) => f.operator && f.value);
    if (!validFilters.length) {
      console.log("No valid filters found.");
      return {};
    }

    const conditions = validFilters
      .flatMap((filter) => {
        const { field, operator, value } = filter;

        const targetFields = field === "*" ? allFields : [field];

        return targetFields.map((targetField) => {
          switch (operator) {
            case EFilterOperator.contains:
              return { [targetField]: { $regex: value, $options: "i" } };
            case EFilterOperator.is:
              return { [targetField]: value };
            case EFilterOperator.is_not:
              return field === "*"
                ? { $nor: targetFields.map((tf) => ({ [tf]: value })) }
                : { [targetField]: { $ne: value } };
            case EFilterOperator.greater_than:
              return { [targetField]: { $gt: value } };
            case EFilterOperator.less_than:
              return { [targetField]: { $lt: value } };
            case EFilterOperator.between:
              const [min, max] = value.split(",").map((v) => v.trim());
              return { [targetField]: { $gte: min, $lte: max } };
            case EFilterOperator.has_any_value:
              return { [targetField]: { $exists: true, $ne: null } };
            default:
              console.error("Unknown operator:", operator);
              return null;
          }
        });
      })
      .filter(Boolean);

    const query = conditions.length ? { $or: conditions } : {};
    console.log("MongoDB Query:", query);

    return query;
  }
}
