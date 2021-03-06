// (C) 2007-2018 GoodData Corporation
import { VisualizationObject } from '@gooddata/typings';
import cloneDeep = require('lodash/cloneDeep');
import get = require('lodash/get');
import set = require('lodash/set');
import flatMap = require('lodash/flatMap');

function getMasterMeasure(
    bucketItems: VisualizationObject.IMeasure[],
    measureIdentifier: string
): VisualizationObject.IMeasure {
    return bucketItems.find(bucketItem => get(bucketItem, ['measure', 'localIdentifier']) === measureIdentifier);
}

function getAllMeasureBucketItems(
    mdObject: VisualizationObject.IVisualizationObjectContent
): VisualizationObject.IMeasure[] {
    const buckets = get<VisualizationObject.IBucket[]>(mdObject, 'buckets', []);
    const allBucketItems = flatMap<VisualizationObject.BucketItem>(buckets, bucket => bucket.items);

    return allBucketItems.reduce((measureItems, bucketItem) => {
        if (VisualizationObject.isMeasure(bucketItem)) {
            measureItems.push(bucketItem);
        }

        return measureItems;
    }, []);
}

/**
 * fillPoPTitlesAndAliases
 * is a function that fills in titles and aliases into pop measure definition based on master measure definition
 * @param mdObject:VisualizationObject.IVisualizationObjectContent - metadata object
 * @param popSuffix:string - string to append to localIdentifier
 * @internal
 */
export function fillPoPTitlesAndAliases(
    mdObject: VisualizationObject.IVisualizationObjectContent,
    popSuffix: string
): VisualizationObject.IVisualizationObjectContent {
    const modifiedMdObject = cloneDeep(mdObject);

    const measureBucketItems = getAllMeasureBucketItems(modifiedMdObject);

    measureBucketItems.forEach((bucketItem) => {
        const popDefinition = get(bucketItem, ['measure', 'definition', 'popMeasureDefinition']);
        if (popDefinition) {
            const masterMeasure = getMasterMeasure(measureBucketItems,
                get<string>(popDefinition, 'measureIdentifier'));

            const originalTitle = get(masterMeasure, ['measure', 'title']);
            const originalAlias = get(masterMeasure, ['measure', 'alias']);

            const title = `${originalTitle}${popSuffix}`;
            const alias = `${originalAlias}${popSuffix}`;

            const titleProp = originalTitle ? { title } : {};
            const aliasProp = originalAlias ? { alias } : {};
            set(bucketItem, 'measure', {
                ...bucketItem.measure,
                ...titleProp,
                ...aliasProp
            });
        }
        return bucketItem;
    });

    return modifiedMdObject;
}
