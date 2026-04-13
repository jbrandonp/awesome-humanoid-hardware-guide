import { Document, Schema as MongooseSchema } from 'mongoose';
export type ClinicalRecordDocument = ClinicalRecord & Document;
export declare class ClinicalRecord {
    patientId: string;
    specialty: string;
    data: Record<string, unknown>;
    status: string;
    deletedAt?: Date;
}
export declare const ClinicalRecordSchema: MongooseSchema<ClinicalRecord, import("mongoose").Model<ClinicalRecord, any, any, any, (Document<unknown, any, ClinicalRecord, any, import("mongoose").DefaultSchemaOptions> & ClinicalRecord & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, ClinicalRecord, any, import("mongoose").DefaultSchemaOptions> & ClinicalRecord & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, ClinicalRecord>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ClinicalRecord, Document<unknown, {}, ClinicalRecord, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ClinicalRecord & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    patientId?: import("mongoose").SchemaDefinitionProperty<string, ClinicalRecord, Document<unknown, {}, ClinicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ClinicalRecord & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    specialty?: import("mongoose").SchemaDefinitionProperty<string, ClinicalRecord, Document<unknown, {}, ClinicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ClinicalRecord & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    data?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, ClinicalRecord, Document<unknown, {}, ClinicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ClinicalRecord & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, ClinicalRecord, Document<unknown, {}, ClinicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ClinicalRecord & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deletedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ClinicalRecord, Document<unknown, {}, ClinicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ClinicalRecord & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ClinicalRecord>;
//# sourceMappingURL=clinical-record.schema.d.ts.map